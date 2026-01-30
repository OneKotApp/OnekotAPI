const express = require('express');
const runController = require('../controllers/runController');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  createRunValidation,
  updateRunValidation,
  dateRangeValidation,
  paginationValidation,
  runIdValidation,
  bulkSyncValidation,
} = require('../middlewares/validator');
const { createRunLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// All run routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/runs
 * @desc    Create a new run session
 * @access  Private
 */
router.post('/', createRunLimiter, createRunValidation, runController.createRun);

/**
 * @route   POST /api/v1/runs/bulk-sync
 * @desc    Bulk sync multiple runs (for offline data)
 * @access  Private
 */
router.post('/bulk-sync', bulkSyncValidation, runController.bulkSyncRuns);

/**
 * @route   GET /api/v1/runs
 * @desc    Get all runs for the authenticated user with pagination
 * @access  Private
 */
router.get('/', paginationValidation, runController.getUserRuns);

/**
 * @route   GET /api/v1/runs/recent
 * @desc    Get recent runs
 * @access  Private
 */
router.get('/recent', runController.getRecentRuns);

/**
 * @route   GET /api/v1/runs/date-range
 * @desc    Get runs within a date range
 * @access  Private
 */
router.get('/date-range', dateRangeValidation, runController.getRunsByDateRange);

/**
 * @route   GET /api/v1/runs/:id
 * @desc    Get a specific run by ID
 * @access  Private
 */
router.get('/:id', runIdValidation, runController.getRunById);

/**
 * @route   GET /api/v1/runs/community-map
 * @desc    Get all community runs for map plotting (all users)
 * @access  Private (authenticated users only)
 */
router.get('/community-map', paginationValidation, runController.getCommunityRuns);

/**
 * @route   GET /api/v1/runs/:id/location-points
 * @desc    Get location points for a specific run
 * @access  Private
 */
router.get('/:id/location-points', runIdValidation, runController.getRunLocationPoints);

/**
 * @route   PATCH /api/v1/runs/:id
 * @desc    Update a run (notes only)
 * @access  Private
 */
router.patch('/:id', updateRunValidation, runController.updateRun);

/**
 * @route   DELETE /api/v1/runs/:id
 * @desc    Delete a run (soft delete)
 * @access  Private
 */
router.delete('/:id', runIdValidation, runController.deleteRun);

module.exports = router;
