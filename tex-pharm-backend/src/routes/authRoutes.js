const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { validate, validateRegister, validateLogin } = require('../middleware/validation');
const {
    register,
    login,
    refreshToken,
    getMe,
    updateProfile,
    changePassword,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

// ===== Strict rate limit on login to slow down brute-force attempts =====
// (in addition to the per-account lockout in the login controller)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 login attempts per IP per 15 min, across all accounts
    message: { success: false, message: 'Too many login attempts from this network. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

// ===== Public Routes =====
router.post('/register', validateRegister, validate, register);
router.post('/login', loginLimiter, validateLogin, validate, login);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// ===== Protected Routes =====
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;