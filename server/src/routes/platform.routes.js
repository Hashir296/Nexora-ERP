const express = require('express');
const path = require('path');
const {
  Folder,
  Document,
  Ticket,
  Notification,
  ChatMessage,
  Announcement,
  AuditLog,
  Setting,
  ApiKey,
  AiConversation,
} = require('../models/Platform');
const { createCrudController, mountCrud } = require('../utils/crudFactory');
const { asyncHandler, sendSuccess, ApiError } = require('../utils/api');
const { upload } = require('../middleware/upload');
const { askAi } = require('../services/aiService');
const crypto = require('crypto');
const registry = require('../plugins/registry');

function platformRoutes() {
  const router = express.Router();

  const folders = express.Router();
  mountCrud(folders, createCrudController(Folder, { searchFields: ['name'] }));
  router.use('/folders', folders);

  const documents = express.Router();
  mountCrud(documents, createCrudController(Document, { populate: ['folder', 'uploadedBy'], searchFields: ['title', 'ocrText'] }));
  documents.post(
    '/upload',
    upload.single('file'),
    asyncHandler(async (req, res) => {
      if (!req.file) throw new ApiError(400, 'File required');
      const item = await Document.create({
        company: req.user.company,
        folder: req.body.folder || undefined,
        title: req.body.title || req.file.originalname,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        ocrText: req.body.ocrText || '',
        uploadedBy: req.user._id,
        versions: [{ version: 1, url: `/uploads/${req.file.filename}`, uploadedBy: req.user._id, note: 'Initial' }],
      });
      sendSuccess(res, { item }, 'Uploaded', 201);
    })
  );
  documents.post(
    '/:id/sign',
    asyncHandler(async (req, res) => {
      const doc = await Document.findById(req.params.id);
      if (!doc) throw new ApiError(404, 'Document not found');
      doc.signatures.push({
        user: req.user._id,
        signedAt: new Date(),
        signatureData: req.body.signatureData || req.user.name,
      });
      await doc.save();
      sendSuccess(res, { item: doc }, 'Signed');
    })
  );
  documents.post(
    '/:id/approve',
    asyncHandler(async (req, res) => {
      const doc = await Document.findById(req.params.id);
      if (!doc) throw new ApiError(404, 'Document not found');
      doc.approval.status = req.body.status || 'approved';
      await doc.save();
      sendSuccess(res, { item: doc }, 'Approval updated');
    })
  );
  router.use('/documents', documents);

  const tickets = express.Router();
  mountCrud(tickets, createCrudController(Ticket, { populate: ['requester', 'assignee'], searchFields: ['subject', 'status', 'priority'] }));
  tickets.post(
    '/:id/reply',
    asyncHandler(async (req, res) => {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) throw new ApiError(404, 'Ticket not found');
      let body = req.body.body;
      let isAi = false;
      if (req.body.aiAuto) {
        isAi = true;
        body = `Thanks for contacting support. We received: "${ticket.subject}". Our team is reviewing this (${ticket.priority} priority). You will get an update soon.`;
      }
      ticket.replies.push({ user: req.user._id, body, isAi });
      if (req.body.status) ticket.status = req.body.status;
      await ticket.save();
      sendSuccess(res, { item: ticket }, 'Reply added');
    })
  );
  router.use('/tickets', tickets);

  const notifications = express.Router();
  mountCrud(notifications, createCrudController(Notification, { searchFields: ['title', 'channel'], companyScoped: false }));
  notifications.get(
    '/mine',
    asyncHandler(async (req, res) => {
      const items = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50);
      sendSuccess(res, { items, unread: items.filter((n) => !n.read).length });
    })
  );
  notifications.post(
    '/read-all',
    asyncHandler(async (req, res) => {
      await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
      sendSuccess(res, null, 'All marked read');
    })
  );
  router.use('/notifications', notifications);

  const chat = express.Router();
  chat.get(
    '/:room',
    asyncHandler(async (req, res) => {
      const items = await ChatMessage.find({ company: req.user.company, room: req.params.room })
        .populate('sender', 'name')
        .sort('createdAt')
        .limit(200);
      sendSuccess(res, { items });
    })
  );
  chat.post(
    '/:room',
    asyncHandler(async (req, res) => {
      const item = await ChatMessage.create({
        company: req.user.company,
        room: req.params.room,
        sender: req.user._id,
        body: req.body.body,
        type: req.body.type || 'text',
        mentions: req.body.mentions || [],
      });
      const populated = await item.populate('sender', 'name');
      const io = req.app.get('io');
      if (io) io.to(req.params.room).emit('chat:message', populated);
      sendSuccess(res, { item: populated }, 'Sent', 201);
    })
  );
  router.use('/chat', chat);

  const announcements = express.Router();
  mountCrud(
    announcements,
    createCrudController(Announcement, {
      searchFields: ['title', 'body'],
      beforeCreate: async (payload, req) => {
        payload.createdBy = req.user._id;
      },
    })
  );
  router.use('/announcements', announcements);

  const settings = express.Router();
  settings.get(
    '/',
    asyncHandler(async (req, res) => {
      const items = await Setting.find({ company: req.user.company });
      sendSuccess(res, { items });
    })
  );
  settings.put(
    '/:key',
    asyncHandler(async (req, res) => {
      const item = await Setting.findOneAndUpdate(
        { company: req.user.company, key: req.params.key },
        { value: req.body.value },
        { upsert: true, new: true }
      );
      sendSuccess(res, { item }, 'Setting saved');
    })
  );
  router.use('/settings', settings);

  const audit = express.Router();
  audit.get(
    '/',
    asyncHandler(async (req, res) => {
      const items = await AuditLog.find({ company: req.user.company }).sort('-createdAt').limit(100).populate('user', 'name email');
      sendSuccess(res, { items });
    })
  );
  router.use('/audit-logs', audit);

  const apiKeys = express.Router();
  apiKeys.get(
    '/',
    asyncHandler(async (req, res) => {
      const items = await ApiKey.find({ company: req.user.company }).select('-keyHash');
      sendSuccess(res, { items });
    })
  );
  apiKeys.post(
    '/',
    asyncHandler(async (req, res) => {
      const raw = `nx_${crypto.randomBytes(24).toString('hex')}`;
      const item = await ApiKey.create({
        company: req.user.company,
        name: req.body.name || 'API Key',
        keyHash: crypto.createHash('sha256').update(raw).digest('hex'),
        prefix: raw.slice(0, 10),
        createdBy: req.user._id,
      });
      sendSuccess(res, { item: { id: item._id, name: item.name, prefix: item.prefix, key: raw } }, 'API key created once — store it securely', 201);
    })
  );
  apiKeys.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await ApiKey.findByIdAndDelete(req.params.id);
      sendSuccess(res, null, 'API key deleted');
    })
  );
  router.use('/api-keys', apiKeys);

  router.get(
    '/plugins',
    asyncHandler(async (req, res) => {
      sendSuccess(res, { plugins: registry.list() });
    })
  );
  router.post(
    '/plugins/:id/toggle',
    asyncHandler(async (req, res) => {
      const plugin = registry.setEnabled(req.params.id, req.body.enabled);
      if (!plugin) throw new ApiError(404, 'Plugin not found');
      sendSuccess(res, { plugin }, 'Plugin updated');
    })
  );

  router.get(
    '/db-monitor',
    asyncHandler(async (req, res) => {
      const mongoose = require('mongoose');
      const state = mongoose.connection.readyState;
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      sendSuccess(res, {
        state: states[state] || state,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        models: Object.keys(mongoose.connection.models),
      });
    })
  );

  return router;
}

function aiRoutes() {
  const router = express.Router();
  router.post(
    '/ask',
    asyncHandler(async (req, res) => {
      const result = await askAi({ user: req.user, message: req.body.message });
      let convo = await AiConversation.findOne({ user: req.user._id }).sort('-updatedAt');
      if (!convo) {
        convo = await AiConversation.create({ company: req.user.company, user: req.user._id, messages: [] });
      }
      convo.messages.push({ role: 'user', content: req.body.message });
      convo.messages.push({ role: 'assistant', content: result.answer });
      if (convo.messages.length > 40) convo.messages = convo.messages.slice(-40);
      await convo.save();
      sendSuccess(res, result);
    })
  );
  router.get(
    '/history',
    asyncHandler(async (req, res) => {
      const convo = await AiConversation.findOne({ user: req.user._id }).sort('-updatedAt');
      sendSuccess(res, { messages: convo?.messages || [] });
    })
  );
  return router;
}

function analyticsRoutes() {
  const router = express.Router();
  router.get(
    '/overview',
    asyncHandler(async (req, res) => {
      const mongoose = require('mongoose');
      const company = req.user.company;
      const companyId = typeof company === 'string' ? new mongoose.Types.ObjectId(company) : company;
      const { Employee, Attendance } = require('../models/HR');
      const { Order, Invoice } = require('../models/Sales');
      const { Lead } = require('../models/CRM');
      const { Product, Stock } = require('../models/Inventory');
      const { Transaction } = require('../models/Finance');

      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const [
        employees,
        orders,
        invoices,
        leads,
        products,
        incomeAgg,
        expenseAgg,
        attendancePresent,
        leadFunnel,
        attendanceByStatus,
      ] = await Promise.all([
        Employee.countDocuments({ company, status: 'active' }),
        Order.countDocuments({ company }),
        Invoice.aggregate([
          { $match: { company: companyId } },
          { $group: { _id: null, total: { $sum: '$total' }, paid: { $sum: '$paid' } } },
        ]),
        Lead.countDocuments({ company }),
        Product.countDocuments({ company, isActive: true }),
        Transaction.aggregate([
          { $match: { company: companyId, type: 'income', date: { $gte: start } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { company: companyId, type: 'expense', date: { $gte: start } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Attendance.countDocuments({ company, date: { $gte: start }, status: 'present' }),
        Lead.aggregate([
          { $match: { company: companyId } },
          { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$value' } } },
        ]),
        Attendance.aggregate([
          { $match: { company: companyId, date: { $gte: start } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);

      const salesByMonth = [];
      const financeByMonth = [];
      for (let i = 5; i >= 0; i -= 1) {
        const s = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
        const e = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0, 23, 59, 59);
        const [orderAgg, incomeM, expenseM] = await Promise.all([
          Order.aggregate([
            { $match: { company: companyId, createdAt: { $gte: s, $lte: e } } },
            { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
          ]),
          Transaction.aggregate([
            { $match: { company: companyId, type: 'income', date: { $gte: s, $lte: e } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          Transaction.aggregate([
            { $match: { company: companyId, type: 'expense', date: { $gte: s, $lte: e } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ]);
        const label = s.toLocaleString('default', { month: 'short' });
        salesByMonth.push({
          label,
          total: orderAgg[0]?.total || 0,
          count: orderAgg[0]?.count || 0,
        });
        financeByMonth.push({
          label,
          income: incomeM[0]?.total || 0,
          expense: expenseM[0]?.total || 0,
        });
      }

      const stockDocs = await Stock.find({ company }).populate('product', 'name lowStockThreshold');
      const stockByProduct = {};
      stockDocs.forEach((s) => {
        const id = s.product?._id?.toString();
        if (!id) return;
        if (!stockByProduct[id]) {
          stockByProduct[id] = {
            name: s.product.name,
            quantity: 0,
            threshold: s.product.lowStockThreshold || 10,
          };
        }
        stockByProduct[id].quantity += s.quantity;
      });
      const inventoryLevels = Object.values(stockByProduct)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 8);

      sendSuccess(res, {
        kpis: {
          employees,
          orders,
          revenue: invoices[0]?.total || 0,
          paid: invoices[0]?.paid || 0,
          leads,
          products,
          incomeMonth: incomeAgg[0]?.total || 0,
          expenseMonth: expenseAgg[0]?.total || 0,
          attendancePresent,
          profitMonth: (incomeAgg[0]?.total || 0) - (expenseAgg[0]?.total || 0),
        },
        charts: {
          salesByMonth,
          financeByMonth,
          leadFunnel: leadFunnel.map((x) => ({ status: x._id, count: x.count, value: x.value })),
          attendanceByStatus: attendanceByStatus.map((x) => ({ status: x._id, count: x.count })),
          inventoryLevels,
        },
        source: 'mongodb',
      });
    })
  );
  return router;
}

module.exports = { platformRoutes, aiRoutes, analyticsRoutes };
