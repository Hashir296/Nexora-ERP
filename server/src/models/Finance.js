const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    code: String,
    type: { type: String, enum: ['asset', 'liability', 'equity', 'income', 'expense'], required: true },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const transactionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    category: String,
    amount: { type: Number, required: true },
    description: String,
    date: { type: Date, default: Date.now },
    reference: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const budgetSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    year: { type: Number, required: true },
    month: Number,
    category: String,
    amount: { type: Number, required: true },
    spent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = {
  Account: mongoose.model('Account', accountSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  Budget: mongoose.model('Budget', budgetSchema),
};
