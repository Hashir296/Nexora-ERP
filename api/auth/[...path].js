/**
 * Dedicated Vercel function for /api/auth/* — avoids loading full ERP on login.
 */
const path = require('path');
module.paths.unshift(path.join(__dirname, '..', 'server', 'node_modules'));

const connectDB = require('../server/src/config/db');
const createAuthApp = require('../server/src/createAuthApp');

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
    const expressApp = await ensure();
    return expressApp(req, res);
  } catch (err) {
    console.error('auth function failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.end(JSON.stringify({ success: false, message: err.message || 'Auth API failed' }));
    }
  }
};
