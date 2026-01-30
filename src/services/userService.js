const User = require('../models/User');
const Run = require('../models/Run');
const Stats = require('../models/Stats');
const LocationPoint = require('../models/LocationPoint');
const LoginActivity = require('../models/LoginActivity');
const ApiError = require('../utils/ApiError');
const { sanitizeUser } = require('../utils/helpers');
const { MESSAGES } = require('../utils/constants');

class UserService {
  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Object} User profile
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    return sanitizeUser(user);
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user profile
   */
  async updateUserProfile(userId, updateData) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    // Update allowed fields
    if (updateData.username !== undefined) {
      user.username = updateData.username;
    }

    if (updateData.profilePicture !== undefined) {
      user.profilePicture = updateData.profilePicture;
    }

    await user.save();

    return sanitizeUser(user);
  }

  /**
   * Get user statistics summary
   * @param {string} userId - User ID
   * @returns {Object} User stats summary
   */
  async getUserStats(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    return {
      totalRuns: user.metadata.totalRuns,
      totalDistance: user.metadata.totalDistance,
      totalDuration: user.metadata.totalDuration,
      totalDistanceKm: (user.metadata.totalDistance / 1000).toFixed(2),
      totalDurationHours: (user.metadata.totalDuration / 3600).toFixed(2),
    };
  }

  /**
   * Delete user account and all associated data
   * @param {string} userId - User ID
   * @returns {Object} Success message
   */
  async deleteUserAccount(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    // Delete all associated data
    await Promise.all([
      Run.deleteMany({ userId }),
      Stats.deleteMany({ userId }),
      LocationPoint.deleteMany({ userId }),
      LoginActivity.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    return { message: MESSAGES.USER_DELETED };
  }

  /**
   * Clear all user data (runs, stats) but keep account
   * @param {string} userId - User ID
   * @returns {Object} Success message
   */
  async clearUserData(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    // Delete runs and stats
    await Promise.all([
      Run.updateMany({ userId }, { $set: { isDeleted: true } }),
      Stats.deleteMany({ userId }),
      LocationPoint.deleteMany({ userId }),
    ]);

    // Reset user metadata
    user.metadata = {
      totalRuns: 0,
      totalDistance: 0,
      totalDuration: 0,
    };

    await user.save();

    return { message: 'User data cleared successfully' };
  }

  /**
   * Get user activity overview
   * @param {string} userId - User ID
   * @returns {Object} Activity overview
   */
  async getUserActivityOverview(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    const [recentRuns, loginHistory] = await Promise.all([
      Run.find({ userId, isDeleted: false })
        .sort({ startTime: -1 })
        .limit(5)
        .select('id startTime distance duration averageSpeed'),
      LoginActivity.getUserLoginHistory(userId, { page: 1, limit: 5 }),
    ]);

    return {
      profile: sanitizeUser(user),
      stats: user.metadata,
      recentRuns,
      recentLogins: loginHistory,
    };
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Object} Success message
   */
  async deactivateAccount(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    user.isActive = false;
    await user.save();

    return { message: 'User account deactivated successfully' };
  }

  /**
   * Activate user account
   * @param {string} userId - User ID
   * @returns {Object} Success message
   */
  async activateAccount(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    user.isActive = true;
    await user.save();

    return { message: 'User account activated successfully' };
  }
}

module.exports = new UserService();
