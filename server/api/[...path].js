/** Nested /api/* — load Express only when a real API route is hit. */
module.exports = async (req, res) => {
  return require('../src/vercelHandler')(req, res);
};
