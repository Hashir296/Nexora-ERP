/**
 * Lightweight Express app for /api/auth/* on Vercel (fast cold start).
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { errorHandler } = require('./utils/api');
const createAuthRouter = require('./createAuthRouter');

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

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }
    return next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const authRouter = createAuthRouter();
  app.use('/api/auth', authRouter);
  app.use('/auth', authRouter);
  app.use('/', authRouter);

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Auth route not found', path: req.url });
  });
  app.use(errorHandler);
  return app;
}

module.exports = createAuthApp;
