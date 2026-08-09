const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    legalName: String,
    code: { type: String, unique: true, sparse: true },
    email: String,
    phone: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },
    taxId: String,
    logo: String,
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const branchSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    code: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const officeSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    name: { type: String, required: true },
    floor: String,
    wifiSSID: String,
    geo: { lat: Number, lng: Number, radiusMeters: { type: Number, default: 200 } },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const departmentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    code: String,
    head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const designationSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true },
    level: { type: Number, default: 1 },
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const teamSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = {
  Company: mongoose.model('Company', companySchema),
  Branch: mongoose.model('Branch', branchSchema),
  Office: mongoose.model('Office', officeSchema),
  Department: mongoose.model('Department', departmentSchema),
  Designation: mongoose.model('Designation', designationSchema),
  Team: mongoose.model('Team', teamSchema),
};
