const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    code: String,
    address: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: String,
    qrCode: String,
    category: String,
    description: String,
    images: [String],
    price: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    variants: [{ name: String, sku: String, price: Number, stock: Number }],
    trackExpiry: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ company: 1, sku: 1 }, { unique: true });

const stockSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    quantity: { type: Number, default: 0 },
    expiryDate: Date,
    batch: String,
  },
  { timestamps: true }
);

stockSchema.index({ product: 1, warehouse: 1, batch: 1 }, { unique: true });

module.exports = {
  Warehouse: mongoose.model('Warehouse', warehouseSchema),
  Product: mongoose.model('Product', productSchema),
  Stock: mongoose.model('Stock', stockSchema),
};
