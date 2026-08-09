const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    employeeCode: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', ''] },
    joinDate: { type: Date, default: Date.now },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      default: 'full-time',
    },
    status: {
      type: String,
      enum: ['active', 'on-leave', 'terminated', 'probation'],
      default: 'active',
    },
    documents: [{ name: String, url: String, type: String, uploadedAt: Date }],
    resume: { url: String, parsed: mongoose.Schema.Types.Mixed },
    experience: [
      {
        company: String,
        title: String,
        from: Date,
        to: Date,
        description: String,
      },
    ],
    skills: [String],
    emergencyContact: { name: String, relation: String, phone: String },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      iban: String,
      branch: String,
    },
    familyDetails: [{ name: String, relation: String, phone: String }],
    medicalDetails: { bloodGroup: String, allergies: String, notes: String },
    performanceHistory: [
      {
        period: String,
        rating: Number,
        comments: String,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date: Date,
      },
    ],
    promotionHistory: [
      {
        from: String,
        to: String,
        date: Date,
        remarks: String,
      },
    ],
    warningLetters: [
      {
        subject: String,
        body: String,
        date: Date,
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    salary: {
      basic: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
    },
  },
  { timestamps: true }
);

employeeSchema.index({ company: 1, employeeCode: 1 }, { unique: true });
employeeSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    date: { type: Date, required: true },
    checkIn: Date,
    checkOut: Date,
    method: {
      type: String,
      enum: ['manual', 'face', 'qr', 'gps', 'wifi'],
      default: 'manual',
    },
    location: { lat: Number, lng: Number },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'holiday'],
      default: 'present',
    },
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
    overtimeMinutes: { type: Number, default: 0 },
    notes: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const shiftSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    breakMinutes: { type: Number, default: 60 },
    graceMinutes: { type: Number, default: 15 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    type: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'unpaid', 'maternity', 'paternity'],
      required: true,
    },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: String,
  },
  { timestamps: true }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    year: { type: Number, required: true },
    annual: { type: Number, default: 20 },
    sick: { type: Number, default: 10 },
    casual: { type: Number, default: 5 },
    usedAnnual: { type: Number, default: 0 },
    usedSick: { type: Number, default: 0 },
    usedCasual: { type: Number, default: 0 },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    basic: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'processed', 'paid'],
      default: 'draft',
    },
    payslipUrl: String,
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = {
  Employee: mongoose.model('Employee', employeeSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Shift: mongoose.model('Shift', shiftSchema),
  Leave: mongoose.model('Leave', leaveSchema),
  LeaveBalance: mongoose.model('LeaveBalance', leaveBalanceSchema),
  Payroll: mongoose.model('Payroll', payrollSchema),
};
