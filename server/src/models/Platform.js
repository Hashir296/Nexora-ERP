const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const documentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
    title: { type: String, required: true },
    filename: String,
    url: String,
    mimeType: String,
    size: Number,
    ocrText: String,
    versions: [
      {
        version: Number,
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    approval: {
      required: { type: Boolean, default: false },
      status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
      approvers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    signatures: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        signedAt: Date,
        signatureData: String,
      },
    ],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    subject: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['ticket', 'complaint'], default: 'ticket' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    slaDue: Date,
    replies: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        body: String,
        isAi: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: String,
    channel: {
      type: String,
      enum: ['in-app', 'email', 'sms', 'push', 'whatsapp'],
      default: 'in-app',
    },
    read: { type: Boolean, default: false },
    link: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const chatMessageSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    room: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: String,
    type: { type: String, enum: ['text', 'system', 'announcement'], default: 'text' },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const announcementSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true },
    body: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const auditLogSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    resource: String,
    resourceId: String,
    ip: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const settingSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    key: { type: String, required: true },
    value: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

settingSchema.index({ company: 1, key: 1 }, { unique: true });

const apiKeySchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    keyHash: { type: String, required: true },
    prefix: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUsedAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const aiConversationSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'] },
        content: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = {
  Folder: mongoose.model('Folder', folderSchema),
  Document: mongoose.model('Document', documentSchema),
  Ticket: mongoose.model('Ticket', ticketSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  ChatMessage: mongoose.model('ChatMessage', chatMessageSchema),
  Announcement: mongoose.model('Announcement', announcementSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  Setting: mongoose.model('Setting', settingSchema),
  ApiKey: mongoose.model('ApiKey', apiKeySchema),
  AiConversation: mongoose.model('AiConversation', aiConversationSchema),
};
