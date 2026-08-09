const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    number: { type: String, required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        qty: Number,
        price: Number,
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected'], default: 'draft' },
    validUntil: Date,
  },
  { timestamps: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    number: { type: String, required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        qty: Number,
        price: Number,
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'sent', 'partial', 'paid', 'overdue', 'refunded'], default: 'draft' },
    dueDate: Date,
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    number: { type: String, required: true },
    channel: { type: String, enum: ['sales', 'pos', 'online'], default: 'sales' },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        qty: Number,
        price: Number,
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'card', 'bank', 'wallet'], default: 'cash' },
    reference: String,
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = {
  Quotation: mongoose.model('Quotation', quotationSchema),
  Invoice: mongoose.model('Invoice', invoiceSchema),
  Order: mongoose.model('Order', orderSchema),
  Payment: mongoose.model('Payment', paymentSchema),
};
