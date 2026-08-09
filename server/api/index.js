/**
 * Vercel serverless entry — deploy with Root Directory = `server`
 */
const serverless = require('serverless-http');
const connectDB = require('../src/config/db');
const createApp = require('../src/app');

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
  if (globalThis.__nexoraHandler) return Promise.resolve(globalThis.__nexoraHandler);
  if (!handlerPromise) {
    handlerPromise = (async () => {
      await withTimeout(connectDB(), 8000, 'MongoDB connect');
      const handler = serverless(createApp());
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
          tip: 'Check MONGODB_URI + Atlas Network Access 0.0.0.0/0',
        })
      );
    }
  }
};
