const jwt = require('jsonwebtoken');
const config = require('../config');

function signAccessToken(payload) {
  const expiresIn = config.jwt.accessExpires || '15m';
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn });
}

function signRefreshToken(payload) {
  const expiresIn = config.jwt.refreshExpires || '7d';
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
