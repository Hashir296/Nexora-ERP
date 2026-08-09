/** POST /api/auth/register */
const path = require('path');
module.paths.unshift(path.join(__dirname, '..', '..', 'server', 'node_modules'));

const connectDB = require('../../server/src/config/db');
const createAuthApp = require('../../server/src/createAuthApp');

let app;
let ready;
async function ensure() {
  if (app) return app;
  if (!ready) {
    ready = (async () => {
      await connectDB();
      app = createAuthApp();
      return app;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

module.exports = async (req, res) => {
  try {
    req.url = '/api/auth/register';
    return (await ensure())(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
  }
};
