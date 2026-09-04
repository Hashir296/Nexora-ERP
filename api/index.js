/**
 * Main API when Root Directory is repo root (.)
 */
const path = require('path');
module.paths.unshift(path.join(__dirname, '..', 'server', 'node_modules'));

const connectDB = require('../server/src/config/db');
const mongoReady = connectDB().catch((err) => err);

let authApp;
let erpApp;

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  if (origin.endsWith('.vercel.app') || origin.includes('localhost') || !origin) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function isAuthUrl(url) {
  return (
    url.includes('/auth') ||
    url.startsWith('/login') ||
    url.startsWith('/register') ||
    url.startsWith('/refresh') ||
    url.startsWith('/me')
  );
}

async function waitForMongo() {
  const result = await Promise.race([
    mongoReady,
    new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connect timed out')), 4000)),
  ]);
  if (result instanceof Error) throw result;
}

module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const url = String(req.url || '').split('?')[0];

  if (url === '/' || url === '' || url === '/api' || url === '/api/') {
    return sendJson(res, 200, { ok: true, service: 'nexora-api' });
  }

  if (url === '/api/ping' || url === '/ping') {
    return sendJson(res, 200, { ok: true, service: 'nexora-api', t: Date.now() });
  }

  try {
    await waitForMongo();

    if (url === '/api/health' || url === '/health') {
      return sendJson(res, 200, {
        success: true,
        message: 'Nexora ERP API healthy',
        runtime: 'vercel-serverless',
      });
    }

    if (isAuthUrl(url)) {
      if (!authApp) {
        const createAuthApp = require('../server/src/createAuthApp');
        authApp = createAuthApp();
      }
      if (!url.startsWith('/api/auth') && !url.startsWith('/auth')) {
        req.url = '/api/auth' + (url.startsWith('/') ? url : '/' + url);
      } else if (url.startsWith('/auth')) {
        req.url = '/api' + url;
      }
      return authApp(req, res);
    }

    if (!erpApp) {
      const createApp = require('../server/src/app');
      erpApp = createApp();
    }
    return erpApp(req, res);
  } catch (err) {
    console.error('API failed:', err);
    if (!res.headersSent) {
      const timedOut = /timed out/i.test(err.message || '');
      sendJson(res, timedOut ? 503 : 500, { success: false, message: err.message || 'API failed' });
    }
  }
};
