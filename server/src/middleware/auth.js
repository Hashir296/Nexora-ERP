const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokens');
const { ApiError, asyncHandler } = require('../utils/api');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;
  if (!token) throw new ApiError(401, 'Authentication required');

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'User not found or inactive');

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub);
    if (user?.isActive) req.user = user;
  } catch {
    /* ignore */
  }
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (roles.length && !roles.includes(req.user.role) && req.user.role !== 'superadmin') {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
}

function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (['superadmin', 'admin'].includes(req.user.role)) return next();
    const has = perms.some((p) => req.user.permissions?.includes(p));
    if (!has) return next(new ApiError(403, 'Missing permission'));
    next();
  };
}

module.exports = { authenticate, optionalAuth, authorize, requirePermission };
