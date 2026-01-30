const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const { updateProfileValidation } = require('../middlewares/validator');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', userController.getUserProfile);

/**
 * @route   PATCH /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/profile', updateProfileValidation, userController.updateUserProfile);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics summary
 * @access  Private
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/v1/users/activity
 * @desc    Get user activity overview
 * @access  Private
 */
router.get('/activity', userController.getUserActivity);

/**
 * @route   DELETE /api/v1/users/data
 * @desc    Clear all user data (runs, stats)
 * @access  Private
 */
router.delete('/data', userController.clearUserData);

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete user account permanently
 * @access  Private
 */
router.delete('/account', userController.deleteAccount);

/**
 * @route   POST /api/v1/users/deactivate
 * @desc    Deactivate user account
 * @access  Private
 */
router.post('/deactivate', userController.deactivateAccount);

/**
 * @route   POST /api/v1/users/activate
 * @desc    Activate user account
 * @access  Private
 */
router.post('/activate', userController.activateAccount);

module.exports = router;
