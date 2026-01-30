const User = require('../models/User');
const LoginActivity = require('../models/LoginActivity');
const ApiError = require('../utils/ApiError');
const { generateToken } = require('../middlewares/authMiddleware');
const { sanitizeUser } = require('../utils/helpers');
const { MESSAGES } = require('../utils/constants');

class AuthService {
  /**
   * Login user with email only (MVP version)
   * @param {Object} loginData - Login credentials and metadata
   * @returns {Object} User data and token
   */
  async login(loginData) {
    const { email, deviceInfo, location, userAgent } = loginData;

    if (!email) {
      throw ApiError.badRequest(MESSAGES.EMAIL_REQUIRED);
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Create new user for MVP
      user = await User.create({
        email: email.toLowerCase().trim(),
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive');
    }

    // Update last login
    await user.updateLastLogin();

    // Log login activity
    await LoginActivity.logActivity({
      userId: user._id,
      email: user.email,
      deviceInfo: deviceInfo || {},
      location: location || {},
      userAgent: userAgent || null,
      status: 'success',
    });

    // Generate token
    const token = generateToken(user);

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  /**
   * Verify token and get user
   * @param {string} userId - User ID from token
   * @returns {Object} User data
   */
  async verifyUser(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive');
    }

    return sanitizeUser(user);
  }

  /**
   * Get user login history
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Array} Login activity records
   */
  async getLoginHistory(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const activities = await LoginActivity.getUserLoginHistory(userId, {
      page,
      limit,
    });

    const totalItems = await LoginActivity.countDocuments({ userId });

    return {
      activities,
      totalItems,
    };
  }
}

module.exports = new AuthService();
