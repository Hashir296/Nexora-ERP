/** Health — Mongo only */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const connectDB = require('../src/config/db');
    await Promise.race([
      connectDB(),
      new Promise((_, r) => setTimeout(() => r(new Error('Mongo timeout')), 8000)),
    ]);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, message: 'Nexora ERP API healthy', runtime: 'vercel-serverless' }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, message: err.message }));
  }
};
