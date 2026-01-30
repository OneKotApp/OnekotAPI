const { body, param, query, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const { MESSAGES, VALIDATION } = require('../utils/constants');

/**
 * Middleware to handle validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.path}: ${err.msg}`)
      .join(', ');

    throw ApiError.badRequest(errorMessages);
  }

  next();
};

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage(MESSAGES.EMAIL_REQUIRED)
    .isEmail()
    .withMessage(MESSAGES.INVALID_EMAIL)
    .normalizeEmail(),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
  body('deviceInfo').optional().isObject().withMessage('Device info must be an object'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  validate,
];

/**
 * Validation rules for creating a run
 */
const createRunValidation = [
  body('id').optional().isString().withMessage('ID must be a string'),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('distance')
    .notEmpty()
    .withMessage('Distance is required')
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),
  body('averageSpeed')
    .notEmpty()
    .withMessage('Average speed is required')
    .isFloat({ min: 0 })
    .withMessage('Average speed must be a positive number'),
  body('maxSpeed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max speed must be a positive number'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: VALIDATION.MAX_NOTES_LENGTH })
    .withMessage(`Notes cannot exceed ${VALIDATION.MAX_NOTES_LENGTH} characters`),
  body('route')
    .notEmpty()
    .withMessage('Route is required')
    .isArray({ min: 1 })
    .withMessage('Route must be an array with at least one point'),
  body('route.*.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('route.*.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('route.*.timestamp')
    .notEmpty()
    .withMessage('Timestamp is required for each route point')
    .isISO8601()
    .withMessage('Timestamp must be a valid date'),
  body('route.*.altitude')
    .optional()
    .isFloat()
    .withMessage('Altitude must be a number'),
  body('route.*.accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accuracy must be a positive number'),
  validate,
];

/**
 * Validation rules for updating a run
 */
const updateRunValidation = [
  param('id').notEmpty().withMessage('Run ID is required'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: VALIDATION.MAX_NOTES_LENGTH })
    .withMessage(`Notes cannot exceed ${VALIDATION.MAX_NOTES_LENGTH} characters`),
  validate,
];

/**
 * Validation rules for getting runs by date range
 */
const dateRangeValidation = [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  validate,
];

/**
 * Validation rules for pagination
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
];

/**
 * Validation rules for stats period
 */
const statsPeriodValidation = [
  query('periodType')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly', 'all_time'])
    .withMessage('Period type must be one of: daily, weekly, monthly, yearly, all_time'),
  validate,
];

/**
 * Validation rules for run ID parameter
 */
const runIdValidation = [
  param('id').notEmpty().withMessage('Run ID is required'),
  validate,
];

/**
 * Validation rules for user profile update
 */
const updateProfileValidation = [
  body('username')
    .optional()
    .isString()
    .withMessage('Username must be a string')
    .isLength({ min: VALIDATION.MIN_USERNAME_LENGTH, max: VALIDATION.MAX_USERNAME_LENGTH })
    .withMessage(
      `Username must be between ${VALIDATION.MIN_USERNAME_LENGTH} and ${VALIDATION.MAX_USERNAME_LENGTH} characters`
    ),
  body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),
  validate,
];

/**
 * Validation rules for bulk sync runs (offline data)
 */
const bulkSyncValidation = [
  body('runs')
    .isArray({ min: 1, max: 100 })
    .withMessage('Runs must be an array with 1-100 items'),
  body('runs.*.startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('runs.*.endTime')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('runs.*.distance')
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number (meters)'),
  body('runs.*.duration')
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer (seconds)'),
  body('runs.*.averageSpeed')
    .isFloat({ min: 0 })
    .withMessage('Average speed must be a positive number (m/s)'),
  body('runs.*.route')
    .isArray({ min: 2 })
    .withMessage('Route must have at least 2 location points'),
  body('runs.*.route.*.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('runs.*.route.*.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('runs.*.route.*.timestamp')
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO 8601 date'),
  validate,
];

module.exports = {
  validate,
  loginValidation,
  createRunValidation,
  updateRunValidation,
  dateRangeValidation,
  paginationValidation,
  statsPeriodValidation,
  runIdValidation,
  updateProfileValidation,
  bulkSyncValidation,
};
