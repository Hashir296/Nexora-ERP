/** Zero-dependency ping — proves Vercel functions are alive */
module.exports = (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, service: 'nexora-api', t: Date.now() }));
};
