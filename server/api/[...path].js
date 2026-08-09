/**
 * Catch-all when Root Directory = server. Auth routes use api/auth/*.js instead.
 */
module.exports = async (req, res) => {
  const url = String(req.url || '');
  if (url.includes('/auth/') || url.startsWith('/auth')) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Use /api/auth/login dedicated function' }));
    return;
  }

  try {
    const connectDB = require('../src/config/db');
    const createApp = require('../src/app');
    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB connect timed out')), 8000)
      ),
    ]);
    return createApp()(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: err.message || 'API failed' }));
    }
  }
};
