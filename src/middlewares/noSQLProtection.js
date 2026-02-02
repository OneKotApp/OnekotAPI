/**
 * Lightweight NoSQL Injection Protection Middleware
 * Protects against MongoDB injection attacks while preserving valid email characters
 * Performance: < 1ms per request
 */

// List of dangerous MongoDB operators that should not appear in user input
const NOSQL_OPERATORS = [
  '$where', '$eq', '$ne', '$gt', '$gte', '$lt', '$lte',
  '$in', '$nin', '$and', '$or', '$not', '$nor',
  '$exists', '$type', '$mod', '$regex', '$text',
  '$expr', '$jsonSchema', '$all', '$elemMatch', '$size'
];

/**
 * Check if a string contains dangerous NoSQL operators
 * @param {string} str - String to check
 * @returns {boolean} True if dangerous pattern found
 */
const containsDangerousOperator = (str) => {
  if (typeof str !== 'string') return false;
  
  const lowerStr = str.toLowerCase();
  return NOSQL_OPERATORS.some(op => lowerStr.includes(op));
};

/**
 * Sanitize string values to prevent NoSQL injection
 * Preserves valid email characters (@, ., -, +, etc.)
 * Only removes dangerous MongoDB operators
 * @param {any} value - Value to sanitize
 * @returns {any} Sanitized value
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Check for dangerous operators
    if (containsDangerousOperator(value)) {
      // Remove $ from beginning of potential operators
      return value.replace(/\$\w+/g, '');
    }
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  
  return value;
};

/**
 * Recursively sanitize object to prevent NoSQL injection
 * Removes keys starting with $ and dangerous operators
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Prevent prototype pollution
  if (Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
      Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
      Object.prototype.hasOwnProperty.call(obj, 'prototype')) {
    return {};
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeValue);
  }

  const sanitized = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    
    // Skip keys that start with $ (MongoDB operators)
    if (key.startsWith('$')) continue;
    
    // Skip dangerous prototype keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    
    sanitized[key] = sanitizeValue(obj[key]);
  }

  return sanitized;
};

/**
 * Express middleware for NoSQL injection protection
 * Sanitizes query params, URL params, and request body
 * Lightweight and preserves valid input (including emails)
 */
const noSQLProtection = (req, res, next) => {
  try {
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    // If sanitization fails, pass error to error handler
    next(error);
  }
};

module.exports = { noSQLProtection, sanitizeValue, sanitizeObject };
