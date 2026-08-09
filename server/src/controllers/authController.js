const crypto = require('crypto');
const User = require('../models/User');
const { Company } = require('../models/Organization');
const { Employee, LeaveBalance } = require('../models/HR');
const { Notification } = require('../models/Platform');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const { ApiError, asyncHandler, sendSuccess } = require('../utils/api');
const config = require('../config');

function setAuthCookies(res, accessToken, refreshToken) {
  const common = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
  };
  res.cookie('accessToken', accessToken, { ...common, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...common, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

function issueTokens(user) {
  const payload = { sub: user._id.toString(), role: user.role, email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function clientMeta(req) {
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || '',
    userAgent: req.headers['user-agent'] || '',
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, companyName, phone } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already registered');

  const company = await Company.create({
    name: companyName || `${name}'s Company`,
    code: `CO-${Date.now().toString(36).toUpperCase()}`,
    email: email.toLowerCase(),
  });

  const verifyToken = crypto.randomBytes(24).toString('hex');
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: 'admin',
    company: company._id,
    emailVerificationToken: verifyToken,
    isEmailVerified: true,
  });

  const employee = await Employee.create({
    user: user._id,
    company: company._id,
    employeeCode: 'EMP-001',
    firstName: name.split(' ')[0],
    lastName: name.split(' ').slice(1).join(' ') || 'Admin',
    email: email.toLowerCase(),
    phone,
    status: 'active',
    salary: { basic: 5000, allowances: 500 },
  });

  user.employee = employee._id;
  await user.save();

  await LeaveBalance.create({
    employee: employee._id,
    company: company._id,
    year: new Date().getFullYear(),
  });

  await Notification.create({
    company: company._id,
    user: user._id,
    title: 'Welcome to Nexora ERP',
    body: 'Your organization workspace is ready. Explore modules from the sidebar.',
    channel: 'in-app',
  });

  const tokens = issueTokens(user);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  const refreshHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
  const meta = clientMeta(req);
  user.devices.push({
    name: 'Primary Device',
    userAgent: meta.userAgent,
    ip: meta.ip,
    lastActive: new Date(),
    refreshTokenHash: refreshHash,
  });
  user.loginHistory.push({ ...meta, success: true });
  user.lastLogin = new Date();
  await user.save();

  sendSuccess(
    res,
    { user: user.toSafeJSON(), ...tokens, company },
    'Registration successful',
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  const meta = clientMeta(req);

  if (!user || !(await user.comparePassword(password))) {
    if (user) {
      user.loginHistory.push({ ...meta, success: false });
      await user.save();
    }
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) throw new ApiError(403, 'Account is disabled');

  if (user.twoFactorEnabled) {
    if (!otp) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      user.otp = code;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      return sendSuccess(res, { requiresOtp: true, demoOtp: code }, 'OTP required for 2FA');
    }
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new ApiError(401, 'Invalid or expired OTP');
    }
    user.otp = undefined;
    user.otpExpires = undefined;
  }

  const tokens = issueTokens(user);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  const refreshHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
  user.devices.push({
    name: meta.userAgent.slice(0, 40) || 'Device',
    userAgent: meta.userAgent,
    ip: meta.ip,
    lastActive: new Date(),
    refreshTokenHash: refreshHash,
  });
  if (user.devices.length > 10) user.devices = user.devices.slice(-10);
  user.loginHistory.push({ ...meta, success: true });
  if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(-50);
  user.lastLogin = new Date();
  await user.save();

  sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token required');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'User not found');

  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const device = user.devices.find((d) => d.refreshTokenHash === hash);
  if (!device) throw new ApiError(401, 'Session expired');

  const tokens = issueTokens(user);
  device.refreshTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
  device.lastActive = new Date();
  await user.save();
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (token && req.user) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    req.user.devices = req.user.devices.filter((d) => d.refreshTokenHash !== hash);
    await req.user.save();
  }
  clearAuthCookies(res);
  sendSuccess(res, null, 'Logged out');
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user.toSafeJSON() });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({ emailVerificationToken: token });
  if (!user) throw new ApiError(400, 'Invalid verification token');
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();
  sendSuccess(res, null, 'Email verified');
});

const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) throw new ApiError(404, 'User not found');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  user.otp = code;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  sendSuccess(res, { demoOtp: code }, 'OTP generated');
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }
  user.otp = undefined;
  user.otpExpires = undefined;
  user.isEmailVerified = true;
  await user.save();
  sendSuccess(res, null, 'OTP verified');
});

const toggleTwoFactor = asyncHandler(async (req, res) => {
  req.user.twoFactorEnabled = Boolean(req.body.enabled);
  await req.user.save();
  sendSuccess(res, { twoFactorEnabled: req.user.twoFactorEnabled }, '2FA updated');
});

const loginHistory = asyncHandler(async (req, res) => {
  sendSuccess(res, { history: req.user.loginHistory.slice().reverse() });
});

const activeSessions = asyncHandler(async (req, res) => {
  const sessions = req.user.devices.map((d) => ({
    id: d._id,
    name: d.name,
    ip: d.ip,
    userAgent: d.userAgent,
    lastActive: d.lastActive,
  }));
  sendSuccess(res, { sessions });
});

const revokeSession = asyncHandler(async (req, res) => {
  req.user.devices = req.user.devices.filter((d) => d._id.toString() !== req.params.id);
  await req.user.save();
  sendSuccess(res, null, 'Session revoked');
});

const securityCenter = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    twoFactorEnabled: req.user.twoFactorEnabled,
    isEmailVerified: req.user.isEmailVerified,
    devices: req.user.devices.length,
    lastLogin: req.user.lastLogin,
    oauthProviders: Object.keys(req.user.oauthProviders || {}).filter(
      (k) => req.user.oauthProviders[k]
    ),
    hasFaceLogin: Boolean(req.user.faceDescriptor?.length),
    hasFingerprint: Boolean(req.user.fingerprintHash),
  });
});

const oauthStub = asyncHandler(async (req, res) => {
  const provider = req.params.provider;
  if (!['google', 'microsoft', 'github'].includes(provider)) {
    throw new ApiError(400, 'Unsupported provider');
  }
  const { email, name, providerId } = req.body;
  if (!email || !providerId) throw new ApiError(400, 'email and providerId required');

  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const company = await Company.create({
      name: `${name || email}'s Company`,
      code: `CO-${Date.now().toString(36).toUpperCase()}`,
      email: email.toLowerCase(),
    });
    user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: crypto.randomBytes(16).toString('hex'),
      role: 'admin',
      company: company._id,
      isEmailVerified: true,
      oauthProviders: { [provider]: providerId },
    });
  } else {
    user.oauthProviders = { ...user.oauthProviders, [provider]: providerId };
    await user.save();
  }

  const tokens = issueTokens(user);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, `${provider} login successful`);
});

const faceLogin = asyncHandler(async (req, res) => {
  const { email, descriptor } = req.body;
  if (!email || !Array.isArray(descriptor)) throw new ApiError(400, 'email and descriptor required');
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user?.faceDescriptor?.length) throw new ApiError(404, 'Face login not enrolled');

  const distance = Math.sqrt(
    descriptor.reduce((sum, v, i) => sum + (v - (user.faceDescriptor[i] || 0)) ** 2, 0)
  );
  if (distance > 0.6) throw new ApiError(401, 'Face not recognized');

  const tokens = issueTokens(user);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, 'Face login successful');
});

const enrollFace = asyncHandler(async (req, res) => {
  const { descriptor } = req.body;
  if (!Array.isArray(descriptor) || descriptor.length < 8) {
    throw new ApiError(400, 'Invalid face descriptor');
  }
  req.user.faceDescriptor = descriptor;
  await req.user.save();
  sendSuccess(res, null, 'Face enrolled');
});

const fingerprintLogin = asyncHandler(async (req, res) => {
  const { email, fingerprintHash } = req.body;
  if (!email || !fingerprintHash) throw new ApiError(400, 'email and fingerprintHash required');
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user?.fingerprintHash || user.fingerprintHash !== fingerprintHash) {
    throw new ApiError(401, 'Fingerprint not recognized');
  }
  const tokens = issueTokens(user);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, 'Fingerprint login successful');
});

const enrollFingerprint = asyncHandler(async (req, res) => {
  const { fingerprintHash } = req.body;
  if (!fingerprintHash) throw new ApiError(400, 'fingerprintHash required');
  req.user.fingerprintHash = fingerprintHash;
  await req.user.save();
  sendSuccess(res, null, 'Fingerprint enrolled');
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  verifyEmail,
  sendOtp,
  verifyOtp,
  toggleTwoFactor,
  loginHistory,
  activeSessions,
  revokeSession,
  securityCenter,
  oauthStub,
  faceLogin,
  enrollFace,
  fingerprintLogin,
  enrollFingerprint,
};
