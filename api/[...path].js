/**
 * Catch-all fallback — must NOT steal /api/auth/* (those have dedicated functions).
 * Fail fast with JSON instead of hanging.
 */
module.exports = async (req, res) => {
  const url = String(req.url || '');
  if (url.includes('/auth/') || url.startsWith('/auth')) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        message: 'Use dedicated auth endpoints (/api/auth/login, /refresh, /me, /register)',
      })
    );
    return;
  }

  try {
    const path = require('path');
    module.paths.unshift(path.join(__dirname, '..', 'server', 'node_modules'));

    const connectDB = require('../server/src/config/db');
    const createApp = require('../server/src/app');

    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB connect timed out')), 8000)
      ),
    ]);

    const app = createApp();
    return app(req, res);
  } catch (err) {
    console.error('API catch-all failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: err.message || 'API failed' }));
    }
  }
};
