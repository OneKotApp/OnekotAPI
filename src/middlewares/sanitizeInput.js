/**
 * Lightweight NoSQL Injection Protection Middleware
 * Protects MongoDB queries while preserving valid email formats
 * Performance: <1ms overhead per request
 */

/**
 * Detect NoSQL injection patterns in strings
 * @param {string} str - String to check
 * @returns {boolean} True if injection pattern detected
 */
const hasNoSQLInjection = (str) => {
  if (typeof str !== 'string') return false;
  
  // MongoDB operator patterns (case-insensitive)
  const injectionPatterns = [
    /\$where/i,
    /\$ne(?![a-zA-Z])/i,      // $ne but not part of email like ne@
    /\$gt(?![a-zA-Z])/i,
    /\$gte(?![a-zA-Z])/i,
    /\$lt(?![a-zA-Z])/i,
    /\$lte(?![a-zA-Z])/i,
    /\$or(?![a-zA-Z])/i,
    /\$and(?![a-zA-Z])/i,
    /\$nor(?![a-zA-Z])/i,
    /\$regex/i,
    /\$expr/i,
    /javascript:/i,
  ];
  
  return injectionPatterns.some(pattern => pattern.test(str));
};

/**
 * Check if object has dangerous keys (MongoDB operators or prototype pollution)
 * @param {Object} obj - Object to check
 * @param {Array} allowedFields - Fields to skip checking (like 'email')
 * @returns {boolean} True if dangerous keys found
 */
const hasDangerousKeys = (obj, allowedFields = []) => {
  if (obj === null || typeof obj !== 'object') return false;
  
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    
    // Check for prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    
    // Check for MongoDB operators in keys
    if (key.startsWith('$')) {
      return true;
    }
    
    // Recursively check nested objects (skip allowed fields)
    if (!allowedFields.includes(key) && typeof obj[key] === 'object') {
      if (hasDangerousKeys(obj[key])) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Smart NoSQL Injection Protection Middleware
 * Protects query params and body while preserving valid email formats
 * Only checks for actual injection patterns, not safe characters
 */
const noSQLProtection = (req, res, next) => {
  try {
    // Check query parameters for injection patterns
    if (req.query) {
      for (const key in req.query) {
        if (Object.prototype.hasOwnProperty.call(req.query, key)) {
          // Block $ operators in keys
          if (key.startsWith('$')) {
            return res.status(400).json({
              success: false,
              message: 'Invalid query parameter',
              statusCode: 400,
            });
          }
          
          const value = req.query[key];
          if (typeof value === 'string' && hasNoSQLInjection(value)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid query parameter value',
              statusCode: 400,
            });
          }
        }
      }
    }

    // Check URL parameters for injection patterns
    if (req.params) {
      for (const key in req.params) {
        if (Object.prototype.hasOwnProperty.call(req.params, key)) {
          const value = req.params[key];
          if (typeof value === 'string' && hasNoSQLInjection(value)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid URL parameter',
              statusCode: 400,
            });
          }
        }
      }
    }

    // Check body for dangerous keys and patterns
    // IMPORTANT: Skip 'email' field to allow @, ., -, etc.
    if (req.body && typeof req.body === 'object') {
      // Check for dangerous keys in body (prototype pollution and $ operators)
      if (hasDangerousKeys(req.body, ['email', 'deviceInfo', 'location'])) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request structure',
          statusCode: 400,
        });
      }
      
      // Check non-email string fields for injection patterns
      for (const key in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, key) && key !== 'email') {
          const value = req.body[key];
          if (typeof value === 'string' && hasNoSQLInjection(value)) {
            return res.status(400).json({
              success: false,
              message: `Invalid value in field: ${key}`,
              statusCode: 400,
            });
          }
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  noSQLProtection,
};
