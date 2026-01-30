// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// API Response Messages
const MESSAGES = {
  // Success Messages
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  FETCHED: 'Resource fetched successfully',
  
  // Auth Messages
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  TOKEN_VALID: 'Token is valid',
  
  // Run Messages
  RUN_CREATED: 'Run session created successfully',
  RUN_FETCHED: 'Run fetched successfully',
  RUN_UPDATED: 'Run updated successfully',
  RUN_DELETED: 'Run deleted successfully',
  RUNS_FETCHED: 'Runs fetched successfully',
  
  // Stats Messages
  STATS_FETCHED: 'Statistics fetched successfully',
  STATS_UPDATED: 'Statistics updated successfully',
  
  // User Messages
  USER_FETCHED: 'User profile fetched successfully',
  USER_UPDATED: 'User profile updated successfully',
  USER_DELETED: 'User deleted successfully',
  
  // Error Messages
  INVALID_INPUT: 'Invalid input provided',
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  
  // Specific Error Messages
  USER_NOT_FOUND: 'User not found',
  RUN_NOT_FOUND: 'Run session not found',
  INVALID_EMAIL: 'Invalid email address',
  EMAIL_REQUIRED: 'Email is required',
  INVALID_DATE_RANGE: 'Invalid date range',
  INVALID_ROUTE_DATA: 'Invalid route data',
  UNAUTHORIZED_ACCESS: 'Unauthorized to access this resource',
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Date/Time Constants
const TIME = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
};

// Validation Rules
const VALIDATION = {
  EMAIL_REGEX: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MAX_NOTES_LENGTH: 500,
  MIN_PASSWORD_LENGTH: 8,
};

// Stats Period Types
const PERIOD_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  ALL_TIME: 'all_time',
};

// Node Environment
const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
};

module.exports = {
  HTTP_STATUS,
  MESSAGES,
  PAGINATION,
  TIME,
  VALIDATION,
  PERIOD_TYPES,
  NODE_ENV,
};
