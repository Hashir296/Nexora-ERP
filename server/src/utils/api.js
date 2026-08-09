class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function sendSuccess(res, data = null, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  res.status(status).json({
    success: false,
    message,
    errors: err.errors || [],
  });
}

module.exports = { ApiError, asyncHandler, sendSuccess, errorHandler };
