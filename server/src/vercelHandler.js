/**
 * Heavy ERP/auth handler — required only after lightweight /api routes return.
 * Loading this at module init on Vercel Hobby exceeds the 10s timeout.
 */
let mongoReady;
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

function getMongo() {
  if (!mongoReady) {
    const connectDB = require('./config/db');
    mongoReady = connectDB().catch((err) => err);
  }
  return mongoReady;
}

async function waitForMongo() {
  const result = await Promise.race([
    getMongo(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connect timed out')), 4000)),
  ]);
  if (result instanceof Error) throw result;
}

/**
 * Vercel does not register api/[...path].js on this project (those URLs 404).
 * vercel.json rewrites /api/* to /api/gateway?path=... so restore the real path.
 */
function applyForwardedPath(req) {
  const raw = String(req.url || '');
  const qIndex = raw.indexOf('?');
  const pathname = (qIndex === -1 ? raw : raw.slice(0, qIndex)).replace(/\/+$/, '') || '/';
  if (pathname !== '/api/gateway' && pathname !== '/gateway') return;

  const params = new URLSearchParams(qIndex === -1 ? '' : raw.slice(qIndex + 1));
  const forwarded = params.get('path');
  if (!forwarded) return;
  params.delete('path');
  const extra = params.toString();
  const next = '/api/' + forwarded.replace(/^\/+/, '');
  req.url = extra ? `${next}?${extra}` : next;
}

module.exports = async function vercelHandler(req, res) {
  applyCors(req, res);
  applyForwardedPath(req);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const url = String(req.url || '').split('?')[0];

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
        const createAuthApp = require('./createAuthApp');
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
      const createApp = require('./app');
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
