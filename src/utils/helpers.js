/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Calculate pagination metadata
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const calculatePagination = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
  };
};

/**
 * Sanitize user object by removing sensitive fields
 * @param {Object} user - User object
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  const { __v, ...sanitized } = userObj;
  return sanitized;
};

/**
 * Convert meters to kilometers
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in kilometers
 */
const metersToKm = (meters) => {
  return parseFloat((meters / 1000).toFixed(2));
};

/**
 * Convert seconds to hours
 * @param {number} seconds - Duration in seconds
 * @returns {number} Duration in hours
 */
const secondsToHours = (seconds) => {
  return parseFloat((seconds / 3600).toFixed(2));
};

/**
 * Format duration to HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get start and end dates for a given period
 * @param {string} periodType - Type of period (daily, weekly, monthly, yearly)
 * @param {Date} date - Reference date
 * @returns {Object} Start and end dates
 */
const getPeriodDates = (periodType, date = new Date()) => {
  const refDate = new Date(date);
  let startDate, endDate;

  switch (periodType) {
    case 'daily':
      startDate = new Date(refDate.setHours(0, 0, 0, 0));
      endDate = new Date(refDate.setHours(23, 59, 59, 999));
      break;

    case 'weekly':
      const dayOfWeek = refDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(refDate);
      startDate.setDate(refDate.getDate() + diffToMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'monthly':
      startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'yearly':
      startDate = new Date(refDate.getFullYear(), 0, 1);
      endDate = new Date(refDate.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    case 'all_time':
      startDate = new Date(0);
      endDate = new Date();
      break;

    default:
      throw new Error('Invalid period type');
  }

  return { startDate, endDate };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Generate unique run ID based on timestamp
 * @returns {string} Unique ID
 */
const generateRunId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

module.exports = {
  asyncHandler,
  calculatePagination,
  sanitizeUser,
  metersToKm,
  secondsToHours,
  formatDuration,
  getPeriodDates,
  isValidEmail,
  generateRunId,
  calculateDistance,
};
