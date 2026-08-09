const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    source: { type: String, default: 'website' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
      default: 'new',
    },
    aiScore: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    value: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const customerSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    website: String,
    address: String,
    type: { type: String, enum: ['individual', 'business'], default: 'business' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [String],
  },
  { timestamps: true }
);

const activitySchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    type: { type: String, enum: ['meeting', 'call', 'email', 'whatsapp'], required: true },
    subject: String,
    body: String,
    relatedTo: {
      model: { type: String, enum: ['Lead', 'Customer'] },
      id: mongoose.Schema.Types.ObjectId,
    },
    scheduledAt: Date,
    completedAt: Date,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['planned', 'done', 'cancelled'], default: 'planned' },
  },
  { timestamps: true }
);

module.exports = {
  Lead: mongoose.model('Lead', leadSchema),
  Customer: mongoose.model('Customer', customerSchema),
  CrmActivity: mongoose.model('CrmActivity', activitySchema),
};
