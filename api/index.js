/**
 * Vercel serverless Express entry for Nexora API.
 */
const path = require('path');

// Prefer root node_modules (hoisted by Vercel installCommand), then server/
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
          tip: 'Check MONGODB_URI and Network Access (0.0.0.0/0) in Atlas',
        })
      );
    }
  }
};
