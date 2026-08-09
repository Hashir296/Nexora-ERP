/**
 * Vercel serverless Express entry for Nexora API.
 * Catch-all so /api/* paths keep the original URL for Express.
 */
const path = require('path');

const serverNm = path.join(__dirname, '..', 'server', 'node_modules');
const rootNm = path.join(__dirname, '..', 'node_modules');
module.paths.unshift(serverNm, rootNm);

const serverless = require('serverless-http');
const connectDB = require('../server/src/config/db');
const createApp = require('../server/src/app');

let handlerPromise = null;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function getHandler() {
  if (globalThis.__nexoraHandler) {
    return Promise.resolve(globalThis.__nexoraHandler);
  }
  if (!handlerPromise) {
    handlerPromise = (async () => {
      await withTimeout(connectDB(), 12000, 'MongoDB connect');
      const app = createApp();
      const handler = serverless(app);
      globalThis.__nexoraHandler = handler;
      return handler;
    })().catch((err) => {
      handlerPromise = null;
      throw err;
    });
  }
  return handlerPromise;
}

module.exports = async (req, res) => {
  try {
    // Vercel rewrite to /api can strip the path; restore from headers when needed
    const original =
      req.headers['x-forwarded-uri'] ||
      req.headers['x-invoke-path'] ||
      req.url;
    if (original && original !== req.url) {
      req.url = original.startsWith('http')
        ? new URL(original).pathname + (new URL(original).search || '')
        : original;
    }

    const handler = await getHandler();
    return handler(req, res);
  } catch (err) {
    console.error('Vercel API bootstrap failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          message: err.message || 'API failed to start',
          tip: 'Check MONGODB_URI and Atlas Network Access (0.0.0.0/0)',
        })
      );
    }
  }
};
