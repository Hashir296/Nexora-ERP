/**
 * Vercel Express entry (server Root Directory).
 * Restores original path after rewrite and avoids serverless-http hangs on Express 5.
 */
const connectDB = require('../src/config/db');
const createApp = require('../src/app');

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
      /* keep req.url */
    }
  }

  // Rewrite destination is often "/api" — recover from originalUrl if present
  if ((req.url === '/api' || req.url === '/api/') && req.originalUrl?.startsWith('/api/')) {
    req.url = req.originalUrl;
  }
}

async function ensureApp() {
  if (app) return app;
  if (!ready) {
    ready = (async () => {
      await Promise.race([
        connectDB(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB connect timed out after 8000ms')), 8000)
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
      res.end(
        JSON.stringify({
          success: false,
          message: err.message || 'API failed to start',
        })
      );
    }
  }
};
