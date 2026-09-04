/** Nested /api/* — load Express only when a real API route is hit. */
module.exports = async (req, res) => {
  const path = require('path');
  module.paths.unshift(path.join(__dirname, '..', 'server', 'node_modules'));
  return require('../server/src/vercelHandler')(req, res);
};
