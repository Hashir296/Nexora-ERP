/**
 * Lightweight health endpoint — avoids Express rewrite path issues on Vercel.
 */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const path = require('path');
    const serverNm = path.join(__dirname, '..', 'server', 'node_modules');
    const rootNm = path.join(__dirname, '..', 'node_modules');
    module.paths.unshift(serverNm, rootNm);

    const connectDB = require('../server/src/config/db');
    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB connect timed out')), 12000)
      ),
    ]);

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        message: 'Nexora ERP API healthy',
        runtime: 'vercel-serverless',
      })
    );
  } catch (err) {
    console.error('health failed:', err);
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        success: false,
        message: err.message || 'Health check failed',
      })
    );
  }
};
