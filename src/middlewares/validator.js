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
    .customSanitizer(value => value ? value.replace(/[${}]/g, '') : value),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .customSanitizer(value => value ? value.replace(/[${}]/g, '') : value),
  body('deviceInfo')
    .optional()
    .isObject()
    .withMessage('Device info must be an object')
    .custom((value) => {
      // Prevent prototype pollution
      if (value && (value.__proto__ || value.constructor || value.prototype)) {
        throw new Error('Invalid device info structure');
      }
      return true;
    }),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object')
    .custom((value) => {
      // Prevent prototype pollution
      if (value && (value.__proto__ || value.constructor || value.prototype)) {
        throw new Error('Invalid location structure');
      }
      return true;
    }),
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
    .trim()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: VALIDATION.MAX_NOTES_LENGTH })
    .withMessage(`Notes cannot exceed ${VALIDATION.MAX_NOTES_LENGTH} characters`)
    .customSanitizer(value => value ? value.replace(/[<>]/g, '') : value),
  body('area')
    .optional()
    .trim()
    .isString()
    .withMessage('Area must be a string')
    .isLength({ max: 200 })
    .withMessage('Area name cannot exceed 200 characters')
    .matches(/^[a-zA-Z0-9\s\-,.()&'"]+$/)
    .withMessage('Area contains invalid characters')
    .customSanitizer(value => {
      // Remove potential NoSQL injection patterns and dangerous characters
      if (!value) return value;
      return value
        .replace(/[${}]/g, '') // Remove NoSQL operators
        .replace(/[<>]/g, '') // Remove HTML/script tags
        .trim();
    }),
  body('totalArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total area must be a positive number (in square meters)'),
  body('route')
    .notEmpty()
    .withMessage('Route is required')
    .isArray({ min: 1 })
    .withMessage('Route must be an array with at least one point'),
  // Validate route array doesn't contain NoSQL injection
  body('route')
    .custom((value) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        throw new Error('Route must be an array, not an object');
      }
      return true;
    }),
  body('id')
    .optional()
    .trim()
    .customSanitizer(value => {
      // Sanitize ID to prevent NoSQL injection
      if (!value) return value;
      return value.replace(/[${}]/g, '');
    }),
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
  param('id')
    .notEmpty()
    .withMessage('Run ID is required')
    .trim()
    .customSanitizer(value => value.replace(/[${}]/g, '')),
  body('notes')
    .optional()
    .trim()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: VALIDATION.MAX_NOTES_LENGTH })
    .withMessage(`Notes cannot exceed ${VALIDATION.MAX_NOTES_LENGTH} characters`)
    .customSanitizer(value => value ? value.replace(/[<>]/g, '') : value),
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
  param('id')
    .notEmpty()
    .withMessage('Run ID is required')
    .trim()
    .customSanitizer(value => value.replace(/[${}]/g, '')),
  validate,
];

/**
 * Validation rules for user profile update
 */
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isString()
    .withMessage('Username must be a string')
    .isLength({ min: VALIDATION.MIN_USERNAME_LENGTH, max: VALIDATION.MAX_USERNAME_LENGTH })
    .withMessage(
      `Username must be between ${VALIDATION.MIN_USERNAME_LENGTH} and ${VALIDATION.MAX_USERNAME_LENGTH} characters`
    )
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .customSanitizer(value => value ? value.replace(/[${}]/g, '') : value),
  body('profilePicture')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Profile picture must be a valid HTTP/HTTPS URL'),
  body('runColor')
    .optional()
    .trim()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Run color must be a valid hex color code (e.g., #FF6B6B or #F00)'),
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
  body('runs.*.area')
    .optional()
    .trim()
    .isString()
    .withMessage('Area must be a string')
    .isLength({ max: 200 })
    .withMessage('Area name cannot exceed 200 characters')
    .matches(/^[a-zA-Z0-9\s\-,.()&'"]+$/)
    .withMessage('Area contains invalid characters')
    .customSanitizer(value => {
      if (!value) return value;
      return value.replace(/[${}]/g, '').replace(/[<>]/g, '').trim();
    }),
  body('runs.*.totalArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total area must be a positive number (in square meters)'),
  body('runs.*.notes')
    .optional()
    .trim()
    .customSanitizer(value => value ? value.replace(/[<>]/g, '') : value),
  body('runs.*.id')
    .optional()
    .trim()
    .customSanitizer(value => value ? value.replace(/[${}]/g, '') : value),
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
