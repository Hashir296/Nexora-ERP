/**
 * Full API catch-all — plugins lazy-loaded to keep cold start under Hobby limit.
 */
const path = require('path');
module.paths.unshift(path.join(__dirname, '..', 'server', 'node_modules'));

let app;
let ready;

function restoreUrl(req) {
  const headerPath =
    req.headers['x-invoke-path'] ||
    req.headers['x-forwarded-uri'] ||
    req.headers['x-vercel-forwarded-path'];
  if (headerPath) {
    try {
      const pathOnly = headerPath.startsWith('http')
        ? new URL(headerPath).pathname
        : String(headerPath).split('?')[0];
      if (pathOnly && pathOnly !== '/api' && pathOnly !== '/') {
        const qs = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        req.url = pathOnly + qs;
      }
    } catch {
      /* keep */
    }
  }
}

async function ensureApp() {
  if (app) return app;
  if (!ready) {
    ready = (async () => {
      const connectDB = require('../server/src/config/db');
      const createApp = require('../server/src/app');
      await Promise.race([
        connectDB(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB connect timed out')), 8000)
        ),
      ]);
      app = createApp();
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
    restoreUrl(req);
    const expressApp = await ensureApp();
    return expressApp(req, res);
  } catch (err) {
    console.error('Vercel API bootstrap failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: err.message || 'API failed to start' }));
    }
  }
};
