/**
 * Vercel serverless entry — Express API (frontend is static from client/dist).
 * Local/dev still uses: node server/src/server.js
 */
const path = require('path');

// Resolve server dependencies when invoked from /api
const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules');
if (!module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

const connectDB = require('../server/src/config/db');
const createApp = require('../server/src/app');

let appPromise = null;

async function getApp() {
  if (globalThis.__nexoraApp) return globalThis.__nexoraApp;
  if (!appPromise) {
    appPromise = (async () => {
      await connectDB();
      const app = createApp();
      globalThis.__nexoraApp = app;
      return app;
    })().catch((err) => {
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('Vercel API bootstrap failed:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        message: err.message || 'API failed to start',
      })
    );
  }
};
