/**
 * Lightweight Express app for /api/auth/* on Vercel (fast cold start).
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { errorHandler } = require('./utils/api');
const authRoutes = require('./routes/auth.routes');

function isOriginAllowed(origin) {
  if (!origin) return true;
  const allowed = Array.isArray(config.clientUrl) ? config.clientUrl : [config.clientUrl];
  if (allowed.includes('*') || allowed.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  return false;
}

function createAuthApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(
    cors({
      origin(origin, cb) {
        if (isOriginAllowed(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api/auth', authRoutes);
  // Vercel catch-all may strip /api/auth prefix
  app.use('/auth', authRoutes);
  app.use('/', authRoutes);

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Auth route not found', path: req.url });
  });
  app.use(errorHandler);
  return app;
}

module.exports = createAuthApp;
