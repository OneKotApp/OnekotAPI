const userService = require('../services/userService');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');
const { MESSAGES } = require('../utils/constants');

class UserController {
  /**
   * Get user profile
   * GET /api/v1/users/profile
   */
  getUserProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserProfile(req.userId);

    const response = ApiResponse.success(MESSAGES.USER_FETCHED, { user });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Update user profile
   * PATCH /api/v1/users/profile
   */
  updateUserProfile = asyncHandler(async (req, res) => {
    const user = await userService.updateUserProfile(req.userId, req.body);

    const response = ApiResponse.success(MESSAGES.USER_UPDATED, { user });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get user statistics summary
   * GET /api/v1/users/stats
   */
  getUserStats = asyncHandler(async (req, res) => {
    const stats = await userService.getUserStats(req.userId);

    const response = ApiResponse.success(MESSAGES.STATS_FETCHED, { stats });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get user activity overview
   * GET /api/v1/users/activity
   */
  getUserActivity = asyncHandler(async (req, res) => {
    const activity = await userService.getUserActivityOverview(req.userId);

    const response = ApiResponse.success('User activity fetched successfully', activity);
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Clear all user data
   * DELETE /api/v1/users/data
   */
  clearUserData = asyncHandler(async (req, res) => {
    const result = await userService.clearUserData(req.userId);

    const response = ApiResponse.success(result.message);
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Delete user account
   * DELETE /api/v1/users/account
   */
  deleteAccount = asyncHandler(async (req, res) => {
    const result = await userService.deleteUserAccount(req.userId);

    const response = ApiResponse.success(result.message);
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Deactivate user account
   * POST /api/v1/users/deactivate
   */
  deactivateAccount = asyncHandler(async (req, res) => {
    const result = await userService.deactivateAccount(req.userId);

    const response = ApiResponse.success(result.message);
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Activate user account
   * POST /api/v1/users/activate
   */
  activateAccount = asyncHandler(async (req, res) => {
    const result = await userService.activateAccount(req.userId);

    const response = ApiResponse.success(result.message);
    res.status(response.statusCode).json(response.toJSON());
  });
}

module.exports = new UserController();
