/**
 * Minimal auth router for Vercel (no rate-limit — avoids serverless hangs).
 */
const express = require('express');
const auth = require('./controllers/authController');
const { authenticate } = require('./middleware/auth');

function createAuthRouter() {
  const router = express.Router();
  router.post('/register', auth.register);
  router.post('/login', auth.login);
  router.post('/refresh', auth.refresh);
  router.post('/verify-email', auth.verifyEmail);
  router.post('/otp/send', auth.sendOtp);
  router.post('/otp/verify', auth.verifyOtp);
  router.post('/logout', authenticate, auth.logout);
  router.get('/me', authenticate, auth.me);
  return router;
}

module.exports = createAuthRouter;
