/**
 * AI Health Routes
 * Routes for AI-powered run analysis, health insights, weekly reports, and voice interactions
 */

const express = require('express');
const aiHealthController = require('../controllers/aiHealthController');
const { authenticate } = require('../middlewares/authMiddleware');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validator');

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// ==========================================
// RUN ANALYSIS ENDPOINTS
// ==========================================

/**
 * @route   POST /api/v1/ai/analyze-run/:runId
 * @desc    Analyze a specific run and get AI health insights
 * @access  Private
 */
router.post(
  '/analyze-run/:runId',
  [
    param('runId').notEmpty().withMessage('Run ID is required'),
    handleValidationErrors,
  ],
  aiHealthController.analyzeRun
);

/**
 * @route   POST /api/v1/ai/analyze-run
 * @desc    Analyze run data (without saving) and get AI health insights
 * @access  Private
 */
router.post(
  '/analyze-run',
  [
    body('distance').isNumeric().withMessage('Distance is required and must be a number'),
    body('duration').isNumeric().withMessage('Duration is required and must be a number'),
    body('averageSpeed').optional().isNumeric().withMessage('Average speed must be a number'),
    body('maxSpeed').optional().isNumeric().withMessage('Max speed must be a number'),
    body('startTime').optional().isISO8601().withMessage('Start time must be a valid date'),
    body('endTime').optional().isISO8601().withMessage('End time must be a valid date'),
    handleValidationErrors,
  ],
  aiHealthController.analyzeRunData
);

// ==========================================
// WEEKLY REPORT ENDPOINTS
// ==========================================

/**
 * @route   GET /api/v1/ai/weekly-report
 * @desc    Generate AI-powered weekly health report
 * @access  Private
 */
router.get(
  '/weekly-report',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    handleValidationErrors,
  ],
  aiHealthController.getWeeklyReport
);

/**
 * @route   GET /api/v1/ai/health-tips
 * @desc    Get personalized health tips based on activity
 * @access  Private
 */
router.get('/health-tips', aiHealthController.getHealthTips);

// ==========================================
// VOICE ASSISTANT ENDPOINTS
// ==========================================

/**
 * @route   POST /api/v1/ai/voice/query
 * @desc    Process voice/text query for health assistant
 * @access  Private
 */
router.post(
  '/voice/query',
  [
    body('transcript').optional().isString().withMessage('Transcript must be a string'),
    body('audioData').optional().isString().withMessage('Audio data must be a base64 string'),
    body('runId').optional().isString().withMessage('Run ID must be a string'),
    handleValidationErrors,
  ],
  aiHealthController.voiceQuery
);

/**
 * @route   POST /api/v1/ai/voice/interact
 * @desc    Full voice interaction (audio in -> AI processing -> audio out)
 * @access  Private
 */
router.post(
  '/voice/interact',
  [
    body('audioData').notEmpty().withMessage('Audio data is required'),
    body('voiceId').optional().isString().withMessage('Voice ID must be a string'),
    body('runId').optional().isString().withMessage('Run ID must be a string'),
    handleValidationErrors,
  ],
  aiHealthController.voiceInteract
);

/**
 * @route   POST /api/v1/ai/voice/tts
 * @desc    Convert text to speech
 * @access  Private
 */
router.post(
  '/voice/tts',
  [
    body('text').notEmpty().withMessage('Text is required'),
    body('voiceId').optional().isString().withMessage('Voice ID must be a string'),
    handleValidationErrors,
  ],
  aiHealthController.textToSpeech
);

/**
 * @route   POST /api/v1/ai/voice/stt
 * @desc    Convert speech to text
 * @access  Private
 */
router.post(
  '/voice/stt',
  [
    body('audioData').optional().isString().withMessage('Audio data must be a base64 string'),
    body('audioUrl').optional().isURL().withMessage('Audio URL must be a valid URL'),
    body('language').optional().isString().withMessage('Language must be a string'),
    handleValidationErrors,
  ],
  aiHealthController.speechToText
);

/**
 * @route   GET /api/v1/ai/voice/voices
 * @desc    Get available TTS voices
 * @access  Private
 */
router.get('/voice/voices', aiHealthController.getVoices);

// ==========================================
// FEEDBACK & STATUS ENDPOINTS
// ==========================================

/**
 * @route   POST /api/v1/ai/feedback
 * @desc    Submit feedback for AI response (for Opik evaluation)
 * @access  Private
 */
router.post(
  '/feedback',
  [
    body('traceId').notEmpty().withMessage('Trace ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().withMessage('Comment must be a string'),
    handleValidationErrors,
  ],
  aiHealthController.submitFeedback
);

/**
 * @route   GET /api/v1/ai/status
 * @desc    Get AI service status
 * @access  Private
 */
router.get('/status', aiHealthController.getStatus);

module.exports = router;
