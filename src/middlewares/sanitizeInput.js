/**
 * Security Middleware for Input Sanitization
 * Protects against NoSQL injection and other security threats
 * with minimal performance overhead
 */

/**
 * Sanitize string to prevent NoSQL injection
 * Removes dangerous MongoDB operators and special characters
 * Preserves valid characters like @ for emails, dots, hyphens, etc.
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Only remove MongoDB operators and dangerous characters
  // Preserve @, dots, hyphens, and other valid special characters
  return str
    .replace(/\$/g, '') // Remove $ (MongoDB operator)
    .replace(/\{/g, '') // Remove {
    .replace(/\}/g, '') // Remove }
    .trim();
};

/**
 * Recursively sanitize an object to prevent NoSQL injection
 * Removes prototype pollution attempts and dangerous patterns
 * Skips email fields to preserve @ symbol
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Prevent prototype pollution
  if (obj.__proto__ || obj.constructor || obj.prototype) {
    return {};
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    // Skip prototype chain properties
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    
    // Skip dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    
    // Sanitize key name (prevent keys like "$where", "$gt", etc.)
    const sanitizedKey = key.replace(/^\$/, '');
    
    const value = obj[key];
    
    // Special handling for email fields - preserve @ . - and other valid email chars
    if (key === 'email' && typeof value === 'string') {
      // Only remove dangerous NoSQL injection characters
      sanitized[sanitizedKey] = value.replace(/[${}]/g, '').trim();
    } else if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeObject(value);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized;
};

/**
 * Middleware to sanitize request inputs (query, params, body)
 * Lightweight security layer with minimal performance impact
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery = {};
      for (const key in req.query) {
        if (Object.prototype.hasOwnProperty.call(req.query, key)) {
          // Skip dangerous keys
          if (key.startsWith('$') || key === '__proto__' || key === 'constructor') {
            continue;
          }
          
          const value = req.query[key];
          if (typeof value === 'string') {
            // Special handling for email fields - only remove NoSQL operators
            if (key === 'email') {
              sanitizedQuery[key] = value.replace(/[${}]/g, '').trim();
            } else {
              sanitizedQuery[key] = sanitizeString(value);
            }
          } else {
            sanitizedQuery[key] = value;
          }
        }
      }
      req.query = sanitizedQuery;
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      const sanitizedParams = {};
      for (const key in req.params) {
        if (Object.prototype.hasOwnProperty.call(req.params, key)) {
          const value = req.params[key];
          if (typeof value === 'string') {
            sanitizedParams[key] = sanitizeString(value);
          } else {
            sanitizedParams[key] = value;
          }
        }
      }
      req.params = sanitizedParams;
    }

    // Sanitize request body (only for non-multipart requests)
    if (req.body && typeof req.body === 'object' && !req.is('multipart/form-data')) {
      req.body = sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    // If sanitization fails, reject the request
    return res.status(400).json({
      success: false,
      message: 'Invalid request format',
      statusCode: 400,
    });
  }
};

/**
 * Middleware to validate and sanitize MongoDB ObjectId
 * Prevents NoSQL injection through invalid ObjectIds
 */
const sanitizeObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName] || req.body[paramName] || req.query[paramName];
    
    if (id) {
      // Check if ID contains only valid characters (alphanumeric)
      if (!/^[a-f\d]{24}$/i.test(id) && !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${paramName} format`,
          statusCode: 400,
        });
      }
    }
    
    next();
  };
};

/**
 * Detect and block common NoSQL injection patterns
 * Extremely lightweight check with regex patterns
 */
const blockNoSQLInjection = (req, res, next) => {
  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    
    // Block common NoSQL injection patterns
    const dangerousPatterns = [
      /\$where/i,
      /\$ne/i,
      /\$gt/i,
      /\$gte/i,
      /\$lt/i,
      /\$lte/i,
      /\$in/i,
      /\$nin/i,
      /\$or/i,
      /\$and/i,
      /\$not/i,
      /\$nor/i,
      /\$exists/i,
      /\$type/i,
      /\$expr/i,
      /\$jsonSchema/i,
      /\$mod/i,
      /\$regex/i,
      /\$text/i,
      /\$elemMatch/i,
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(value));
  };
  
  const checkObject = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    
    for (const key in obj) {
      if (key.startsWith('$')) return true;
      if (checkValue(obj[key])) return true;
      if (typeof obj[key] === 'object' && checkObject(obj[key])) return true;
    }
    return false;
  };
  
  // Check query, params, and body
  if (checkObject(req.query) || checkObject(req.params) || checkObject(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request: potentially malicious input detected',
      statusCode: 400,
    });
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeObject,
  sanitizeObjectId,
  blockNoSQLInjection,
};
