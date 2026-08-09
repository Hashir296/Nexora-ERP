/**
 * POST /api/auth/login — Root Directory = server
 */
const connectDB = require('../../src/config/db');
const createAuthApp = require('../../src/createAuthApp');

let app;
let ready;

async function ensure() {
  if (app) return app;
  if (!ready) {
    ready = (async () => {
      await Promise.race([
        connectDB(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB connect timed out')), 8000)
        ),
      ]);
      app = createAuthApp();
      return app;
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

module.exports = async (req, res) => {
  try {
    if (!String(req.url || '').includes('login')) {
      req.url = '/api/auth/login';
    } else if (!String(req.url).startsWith('/api/auth')) {
      req.url = '/api/auth/login';
    }
    const expressApp = await ensure();
    return expressApp(req, res);
  } catch (err) {
    console.error('login function failed:', err);
    if (!res.headersSent) {
      const origin = req.headers.origin || '';
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.end(JSON.stringify({ success: false, message: err.message || 'Login API failed' }));
    }
  }
};
