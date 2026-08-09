const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');
const { errorHandler } = require('./utils/api');
const { apiLimiter } = require('./middleware/rateLimit');
const { authenticate } = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');
const { registerCorePlugins } = require('./plugins');
const registry = require('./plugins/registry');
const { uploadRoot } = require('./middleware/upload');
const { AuditLog } = require('./models/Platform');

function createApp() {
  const app = express();
  registerCorePlugins();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(compression());
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/uploads', express.static(uploadRoot));
  app.use('/api', apiLimiter);

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Nexora ERP API healthy',
      plugins: registry.enabled().map((p) => p.id),
    });
  });

  app.use('/api/auth', authRoutes);

  app.use(async (req, res, next) => {
    if (!req.path.startsWith('/api/') || req.path.startsWith('/api/auth') || req.path === '/api/health') {
      return next();
    }
    const start = Date.now();
    res.on('finish', async () => {
      if (req.user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        try {
          await AuditLog.create({
            company: req.user.company,
            user: req.user._id,
            action: `${req.method} ${req.originalUrl}`,
            resource: req.baseUrl,
            ip: req.ip,
            meta: { status: res.statusCode, ms: Date.now() - start },
          });
        } catch {
          /* ignore audit failures */
        }
      }
    });
    next();
  });

  registry.mount(app, authenticate);

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
