const express = require('express');
const statsController = require('../controllers/statsController');
const { authenticate } = require('../middlewares/authMiddleware');
const { statsPeriodValidation } = require('../middlewares/validator');

const router = express.Router();

// All stats routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/stats/overview
 * @desc    Get comprehensive statistics overview (all periods)
 * @access  Private
 */
router.get('/overview', statsController.getStatsOverview);

/**
 * @route   GET /api/v1/stats/all-time
 * @desc    Get all-time statistics
 * @access  Private
 */
router.get('/all-time', statsController.getAllTimeStats);

/**
 * @route   GET /api/v1/stats/weekly
 * @desc    Get weekly statistics
 * @access  Private
 */
router.get('/weekly', statsController.getWeeklyStats);

/**
 * @route   GET /api/v1/stats/monthly
 * @desc    Get monthly statistics
 * @access  Private
 */
router.get('/monthly', statsController.getMonthlyStats);

/**
 * @route   GET /api/v1/stats/yearly
 * @desc    Get yearly statistics
 * @access  Private
 */
router.get('/yearly', statsController.getYearlyStats);

/**
 * @route   POST /api/v1/stats/refresh
 * @desc    Refresh all statistics (recalculate)
 * @access  Private
 */
router.post('/refresh', statsController.refreshStats);

/**
 * @route   GET /api/v1/stats/:periodType
 * @desc    Get statistics by period type
 * @access  Private
 */
router.get('/:periodType', statsPeriodValidation, statsController.getStatsByPeriod);

module.exports = router;
