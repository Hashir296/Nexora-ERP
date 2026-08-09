/**
 * POST /api/auth/login — zero top-level heavy requires (avoids Vercel cold-start timeout).
 */
module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  const allowOrigin = origin.endsWith('.vercel.app') || origin.includes('localhost') || !origin;

  const setCors = () => {
    if (origin && allowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  };

  setCors();

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  try {
    const path = require('path');
    module.paths.unshift(
      path.join(__dirname, '..', '..', 'server', 'node_modules'),
      path.join(__dirname, '..', '..', 'node_modules')
    );

    const connectDB = require('../../server/src/config/db');
    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB connect timed out')), 8000)
      ),
    ]);

    const createAuthApp = require('../../server/src/createAuthApp');
    const app = createAuthApp();
    req.url = '/api/auth/login';
    return app(req, res);
  } catch (err) {
    console.error('login function failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      setCors();
      res.end(JSON.stringify({ success: false, message: err.message || 'Login API failed' }));
    }
  }
};
