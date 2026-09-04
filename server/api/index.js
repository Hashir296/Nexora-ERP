/**
 * Lightweight /api entry — no Mongo/Express at load so Vercel Hobby never 504s on /.
 */
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

function isLightUrl(url) {
  return (
    url === '/' ||
    url === '' ||
    url === '/api' ||
    url === '/api/' ||
    url === '/api/ping' ||
    url === '/ping'
  );
}

module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const url = String(req.url || '').split('?')[0];
  if (isLightUrl(url)) {
    return sendJson(res, 200, { ok: true, service: 'nexora-api', t: Date.now() });
  }

  return require('../src/vercelHandler')(req, res);
};
