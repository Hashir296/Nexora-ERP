const express = require('express');
const { Warehouse, Product, Stock } = require('../models/Inventory');
const { createCrudController, mountCrud } = require('../utils/crudFactory');
const { asyncHandler, sendSuccess } = require('../utils/api');

const router = express.Router();

const warehouses = express.Router();
mountCrud(warehouses, createCrudController(Warehouse, { searchFields: ['name', 'code'] }));
router.use('/warehouses', warehouses);

const products = express.Router();
mountCrud(products, createCrudController(Product, { searchFields: ['name', 'sku', 'barcode', 'category'] }));
router.use('/products', products);

const stocks = express.Router();
mountCrud(stocks, createCrudController(Stock, { populate: ['product', 'warehouse'], searchFields: ['batch'] }));
router.use('/stocks', stocks);

router.get(
  '/alerts/low-stock',
  asyncHandler(async (req, res) => {
    const productsList = await Product.find({ company: req.user.company, isActive: true });
    const stocksList = await Stock.find({ company: req.user.company });
    const qtyMap = {};
    stocksList.forEach((s) => {
      const id = s.product.toString();
      qtyMap[id] = (qtyMap[id] || 0) + s.quantity;
    });
    const alerts = productsList
      .map((p) => ({
        product: p,
        quantity: qtyMap[p._id.toString()] || 0,
        threshold: p.lowStockThreshold,
      }))
      .filter((a) => a.quantity <= a.threshold);
    sendSuccess(res, { alerts });
  })
);

router.get(
  '/demand-prediction',
  asyncHandler(async (req, res) => {
    const productsList = await Product.find({ company: req.user.company, isActive: true }).limit(20);
    const stocksList = await Stock.find({ company: req.user.company });
    const qtyMap = {};
    stocksList.forEach((s) => {
      const id = s.product.toString();
      qtyMap[id] = (qtyMap[id] || 0) + s.quantity;
    });
    const predictions = productsList.map((p) => {
      const qty = qtyMap[p._id.toString()] || 0;
      return {
        productId: p._id,
        name: p.name,
        current: qty,
        suggestedReorder: Math.max(p.lowStockThreshold * 2, Math.ceil(qty * 1.25) || p.lowStockThreshold),
      };
    });
    sendSuccess(res, { predictions });
  })
);

module.exports = router;
