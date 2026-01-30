const statsService = require('../services/statsService');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');
const { MESSAGES } = require('../utils/constants');

class StatsController {
  /**
   * Get all-time statistics
   * GET /api/v1/stats/all-time
   */
  getAllTimeStats = asyncHandler(async (req, res) => {
    const stats = await statsService.getAllTimeStats(req.userId);

    const response = ApiResponse.success(MESSAGES.STATS_FETCHED, { stats });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get weekly statistics
   * GET /api/v1/stats/weekly
   */
  getWeeklyStats = asyncHandler(async (req, res) => {
    const stats = await statsService.getWeeklyStats(req.userId);

    const response = ApiResponse.success(MESSAGES.STATS_FETCHED, { stats });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get monthly statistics
   * GET /api/v1/stats/monthly
   */
  getMonthlyStats = asyncHandler(async (req, res) => {
    const stats = await statsService.getMonthlyStats(req.userId);

    const response = ApiResponse.success(MESSAGES.STATS_FETCHED, { stats });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get yearly statistics
   * GET /api/v1/stats/yearly
   */
  getYearlyStats = asyncHandler(async (req, res) => {
    const stats = await statsService.getYearlyStats(req.userId);

    const response = ApiResponse.success(MESSAGES.STATS_FETCHED, { stats });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get comprehensive stats overview
   * GET /api/v1/stats/overview
   */
  getStatsOverview = asyncHandler(async (req, res) => {
    const stats = await statsService.getStatsOverview(req.userId);

    const response = ApiResponse.success(MESSAGES.STATS_FETCHED, { stats });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Refresh all statistics
   * POST /api/v1/stats/refresh
   */
  refreshStats = asyncHandler(async (req, res) => {
    const stats = await statsService.refreshAllStats(req.userId);

    const response = ApiResponse.success(MESSAGES.STATS_UPDATED, { stats });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get stats by period type
   * GET /api/v1/stats/:periodType
   */
  getStatsByPeriod = asyncHandler(async (req, res) => {
    const { periodType } = req.params;

    const stats = await statsService.getStatsByPeriod(req.userId, periodType);

    const response = ApiResponse.success(MESSAGES.STATS_FETCHED, { stats, count: stats.length });
    res.status(response.statusCode).json(response.toJSON());
  });
}

module.exports = new StatsController();
