const express = require('express');
const { Account, Transaction, Budget } = require('../models/Finance');
const { createCrudController, mountCrud } = require('../utils/crudFactory');
const { asyncHandler, sendSuccess } = require('../utils/api');

const router = express.Router();

const accounts = express.Router();
mountCrud(accounts, createCrudController(Account, { searchFields: ['name', 'code', 'type'] }));
router.use('/accounts', accounts);

const transactions = express.Router();
mountCrud(
  transactions,
  createCrudController(Transaction, {
    populate: ['account', 'createdBy'],
    searchFields: ['category', 'description', 'type'],
    beforeCreate: async (payload, req) => {
      payload.createdBy = req.user._id;
    },
  })
);
router.use('/transactions', transactions);

const budgets = express.Router();
mountCrud(budgets, createCrudController(Budget, { searchFields: ['name', 'category'] }));
router.use('/budgets', budgets);

router.get(
  '/reports/pnl',
  asyncHandler(async (req, res) => {
    const company = req.user.company;
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    const txs = await Transaction.find({ company, date: { $gte: start, $lte: end } });
    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    sendSuccess(res, {
      year,
      income,
      expense,
      profit: income - expense,
      loss: expense > income ? expense - income : 0,
    });
  })
);

router.get(
  '/reports/cashflow',
  asyncHandler(async (req, res) => {
    const company = req.user.company;
    const months = [];
    for (let m = 0; m < 12; m += 1) {
      const start = new Date(new Date().getFullYear(), m, 1);
      const end = new Date(new Date().getFullYear(), m + 1, 0, 23, 59, 59);
      const txs = await Transaction.find({ company, date: { $gte: start, $lte: end } });
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      months.push({ month: m + 1, income, expense, net: income - expense });
    }
    sendSuccess(res, { months });
  })
);

router.get(
  '/reports/balance-sheet',
  asyncHandler(async (req, res) => {
    const accounts = await Account.find({ company: req.user.company, isActive: true });
    const group = (type) =>
      accounts.filter((a) => a.type === type).reduce((s, a) => s + (a.balance || 0), 0);
    sendSuccess(res, {
      assets: group('asset'),
      liabilities: group('liability'),
      equity: group('equity'),
      income: group('income'),
      expense: group('expense'),
      accounts,
    });
  })
);

module.exports = router;
