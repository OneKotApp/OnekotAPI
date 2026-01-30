const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { loginValidation, paginationValidation } = require('../middlewares/validator');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user with email only (MVP)
 * @access  Public
 */
router.post('/login', authLimiter, loginValidation, authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   GET /api/v1/auth/login-history
 * @desc    Get user login history
 * @access  Private
 */
router.get(
  '/login-history',
  authenticate,
  paginationValidation,
  authController.getLoginHistory
);

/**
 * @route   GET /api/v1/auth/health
 * @desc    Health check for auth service
 * @access  Public
 */
router.get('/health', authController.healthCheck);

module.exports = router;
