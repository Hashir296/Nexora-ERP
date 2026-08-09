const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deviceSchema = new mongoose.Schema(
  {
    name: String,
    userAgent: String,
    ip: String,
    lastActive: Date,
    refreshTokenHash: String,
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'hr', 'manager', 'employee', 'sales', 'finance'],
      default: 'employee',
    },
    permissions: [{ type: String }],
    avatar: String,
    phone: String,
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    otp: String,
    otpExpires: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    loginHistory: [
      {
        ip: String,
        userAgent: String,
        at: { type: Date, default: Date.now },
        success: Boolean,
      },
    ],
    devices: [deviceSchema],
    oauthProviders: {
      google: String,
      microsoft: String,
      github: String,
    },
    faceDescriptor: [Number],
    fingerprintHash: String,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    permissions: this.permissions,
    avatar: this.avatar,
    phone: this.phone,
    isEmailVerified: this.isEmailVerified,
    twoFactorEnabled: this.twoFactorEnabled,
    company: this.company,
    branch: this.branch,
    employee: this.employee,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
