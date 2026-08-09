/**
 * Main API entry (Root Directory must be `server`).
 * Auth + rest of ERP — lazy requires so cold start / build stay light.
 */
module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (origin.endsWith('.vercel.app') || origin.includes('localhost') || !origin) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  try {
    const connectDB = require('../src/config/db');
    await Promise.race([
      connectDB(),
      new Promise((_, r) => setTimeout(() => r(new Error('MongoDB connect timed out')), 8000)),
    ]);

    const url = String(req.url || '');
    const isAuth = url.includes('/auth') || url.startsWith('/login') || url.startsWith('/register') || url.startsWith('/refresh') || url.startsWith('/me');

    if (isAuth) {
      const createAuthApp = require('../src/createAuthApp');
      if (!url.startsWith('/api/auth') && !url.startsWith('/auth')) {
        req.url = '/api/auth' + (url.startsWith('/') ? url : '/' + url);
      } else if (url.startsWith('/auth')) {
        req.url = '/api' + url;
      }
      return createAuthApp()(req, res);
    }

    const createApp = require('../src/app');
    return createApp()(req, res);
  } catch (err) {
    console.error('API failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: err.message || 'API failed' }));
    }
  }
};
