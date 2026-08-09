const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();

function parseClientOrigins(value) {
  const list = String(value || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 1 ? list[0] : list;
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexora_erp',
  clientUrl: parseClientOrigins(process.env.CLIENT_URL),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'nexora_dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'nexora_dev_refresh_secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  googleAiModel: process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash-lite',
};
