const express = require('express');
const auth = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', authLimiter, auth.register);
router.post('/login', authLimiter, auth.login);
router.post('/refresh', auth.refresh);
router.post('/verify-email', auth.verifyEmail);
router.post('/otp/send', authLimiter, auth.sendOtp);
router.post('/otp/verify', auth.verifyOtp);
router.post('/oauth/:provider', authLimiter, auth.oauthStub);
router.post('/face-login', authLimiter, auth.faceLogin);
router.post('/fingerprint-login', authLimiter, auth.fingerprintLogin);

router.use(authenticate);
router.post('/logout', auth.logout);
router.get('/me', auth.me);
router.post('/2fa', auth.toggleTwoFactor);
router.get('/login-history', auth.loginHistory);
router.get('/sessions', auth.activeSessions);
router.delete('/sessions/:id', auth.revokeSession);
router.get('/security', auth.securityCenter);
router.post('/enroll/face', auth.enrollFace);
router.post('/enroll/fingerprint', auth.enrollFingerprint);

module.exports = router;
