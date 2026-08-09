/**
 * Vercel serverless Express entry for Nexora API.
 */
const path = require('path');

const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules');
module.paths.unshift(serverNodeModules);

const serverless = require('serverless-http');
const connectDB = require('../server/src/config/db');
const createApp = require('../server/src/app');

let handlerPromise = null;

function getHandler() {
  if (globalThis.__nexoraHandler) {
    return Promise.resolve(globalThis.__nexoraHandler);
  }
  if (!handlerPromise) {
    handlerPromise = (async () => {
      await connectDB();
      const app = createApp();
      const handler = serverless(app, {
        binary: ['application/octet-stream', 'image/*'],
      });
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
          tip: 'Check MONGODB_URI and other env vars in Vercel project settings',
        })
      );
    }
  }
};
