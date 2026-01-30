const authService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');
const { MESSAGES } = require('../utils/constants');

class AuthController {
  /**
   * Login user with email only
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, deviceInfo, location } = req.body;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login({
      email,
      deviceInfo,
      location,
      userAgent,
    });

    const response = ApiResponse.success(MESSAGES.LOGIN_SUCCESS, result);
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Verify token and get current user
   * GET /api/v1/auth/me
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await authService.verifyUser(req.userId);

    const response = ApiResponse.success(MESSAGES.USER_FETCHED, { user });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get user login history
   * GET /api/v1/auth/login-history
   */
  getLoginHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const result = await authService.getLoginHistory(req.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    const response = ApiResponse.success('Login history fetched successfully', result);
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Health check for auth service
   * GET /api/v1/auth/health
   */
  healthCheck = asyncHandler(async (req, res) => {
    const response = ApiResponse.success('Auth service is running');
    res.status(response.statusCode).json(response.toJSON());
  });
}

module.exports = new AuthController();
