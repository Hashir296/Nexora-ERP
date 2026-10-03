/** Lazy entry so Vercel literal routes (login.js) and /api/gateway share one handler. */
module.exports = function apiEntry(fixedPath) {
  return async function handler(req, res) {
    const path = require('path');
    module.paths.unshift(path.join(__dirname, '..', 'server', 'node_modules'));
    if (fixedPath) {
      const raw = String(req.url || '');
      const q = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
      req.url = fixedPath + q;
    }
    return require('../server/src/vercelHandler')(req, res);
  };
};
