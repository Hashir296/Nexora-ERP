const express = require('express');
const { Quotation, Invoice, Order, Payment } = require('../models/Sales');
const { createCrudController, mountCrud } = require('../utils/crudFactory');
const { asyncHandler, sendSuccess, ApiError } = require('../utils/api');

const router = express.Router();

function calcTotals(items = []) {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;
  items.forEach((it) => {
    const line = (it.qty || 0) * (it.price || 0);
    const discount = it.discount || 0;
    const tax = it.tax || 0;
    subtotal += line;
    discountTotal += discount;
    taxTotal += tax;
  });
  return {
    subtotal,
    taxTotal,
    discountTotal,
    total: subtotal - discountTotal + taxTotal,
  };
}

function withTotals(controller) {
  const originalCreate = controller.create;
  const originalUpdate = controller.update;
  return {
    ...controller,
    create: asyncHandler(async (req, res, next) => {
      if (Array.isArray(req.body.items)) Object.assign(req.body, calcTotals(req.body.items));
      return originalCreate(req, res, next);
    }),
    update: asyncHandler(async (req, res, next) => {
      if (Array.isArray(req.body.items)) Object.assign(req.body, calcTotals(req.body.items));
      return originalUpdate(req, res, next);
    }),
  };
}

const quotations = express.Router();
mountCrud(quotations, withTotals(createCrudController(Quotation, { populate: ['customer'], searchFields: ['number', 'status'] })));
router.use('/quotations', quotations);

const invoices = express.Router();
mountCrud(invoices, withTotals(createCrudController(Invoice, { populate: ['customer', 'order'], searchFields: ['number', 'status'] })));
router.use('/invoices', invoices);

const orders = express.Router();
mountCrud(orders, withTotals(createCrudController(Order, { populate: ['customer'], searchFields: ['number', 'status', 'channel'] })));
orders.post(
  '/pos',
  asyncHandler(async (req, res) => {
    const items = req.body.items || [];
    const totals = calcTotals(items);
    const count = await Order.countDocuments({ company: req.user.company });
    const item = await Order.create({
      company: req.user.company,
      customer: req.body.customer,
      number: `POS-${Date.now()}-${count + 1}`,
      channel: 'pos',
      items,
      ...totals,
      status: 'completed',
    });
    sendSuccess(res, { item }, 'POS sale completed', 201);
  })
);
router.use('/orders', orders);

const payments = express.Router();
mountCrud(payments, createCrudController(Payment, { populate: ['invoice'], searchFields: ['method', 'reference', 'status'] }));
payments.post(
  '/refund',
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.body.paymentId);
    if (!payment) throw new ApiError(404, 'Payment not found');
    payment.status = 'refunded';
    await payment.save();
    if (payment.invoice) {
      const invoice = await Invoice.findById(payment.invoice);
      if (invoice) {
        invoice.paid = Math.max(0, invoice.paid - payment.amount);
        invoice.status = invoice.paid === 0 ? 'refunded' : 'partial';
        await invoice.save();
      }
    }
    sendSuccess(res, { item: payment }, 'Refund processed');
  })
);
router.use('/payments', payments);

module.exports = router;
