/**
 * POST /api/auth/login — dedicated Vercel function (no catch-all).
 */
const path = require('path');
module.paths.unshift(path.join(__dirname, '..', '..', 'server', 'node_modules'));
module.paths.unshift(path.join(__dirname, '..', '..', 'node_modules'));

const connectDB = require('../../server/src/config/db');
const createAuthApp = require('../../server/src/createAuthApp');

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
    // Ensure Express sees /api/auth/login
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
