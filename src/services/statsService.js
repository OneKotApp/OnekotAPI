const Stats = require('../models/Stats');
const Run = require('../models/Run');
const ApiError = require('../utils/ApiError');
const { getPeriodDates } = require('../utils/helpers');
const { PERIOD_TYPES } = require('../utils/constants');

class StatsService {
  /**
   * Calculate and update statistics for a user
   * @param {string} userId - User ID
   * @param {string} periodType - Type of period
   * @param {Date} refDate - Reference date
   * @returns {Object} Updated stats
   */
  async calculateStats(userId, periodType, refDate = new Date()) {
    const { startDate, endDate } = getPeriodDates(periodType, refDate);

    // Get runs for the period
    const runs = await Run.find({
      userId,
      isDeleted: false,
      startTime: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (runs.length === 0) {
      return {
        userId,
        periodType,
        periodStart: startDate,
        periodEnd: endDate,
        totalDistance: 0,
        totalDuration: 0,
        totalRuns: 0,
        averageSpeed: 0,
        longestRun: 0,
        longestDuration: 0,
        fastestSpeed: 0,
      };
    }

    // Calculate statistics
    const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const totalDuration = runs.reduce((sum, run) => sum + run.duration, 0);
    const totalRuns = runs.length;
    const averageSpeed = totalDuration > 0 ? (totalDistance / totalDuration) * 3.6 : 0;
    const longestRun = Math.max(...runs.map((run) => run.distance));
    const longestDuration = Math.max(...runs.map((run) => run.duration));
    const fastestSpeed = Math.max(...runs.map((run) => run.averageSpeed));

    // Update or create stats
    const stats = await Stats.updateOrCreateStats(userId, periodType, startDate, endDate, {
      totalDistance,
      totalDuration,
      totalRuns,
      averageSpeed,
      longestRun,
      longestDuration,
      fastestSpeed,
    });

    return stats;
  }

  /**
   * Get stats for a specific period type
   * @param {string} userId - User ID
   * @param {string} periodType - Type of period
   * @returns {Array} Stats records
   */
  async getStatsByPeriod(userId, periodType) {
    if (!Object.values(PERIOD_TYPES).includes(periodType)) {
      throw ApiError.badRequest('Invalid period type');
    }

    const stats = await Stats.getStatsByPeriod(userId, periodType);
    return stats;
  }

  /**
   * Get all-time statistics
   * @param {string} userId - User ID
   * @returns {Object} All-time stats
   */
  async getAllTimeStats(userId) {
    let stats = await Stats.getAllTimeStats(userId);

    // If stats don't exist, calculate them
    if (!stats) {
      stats = await this.calculateStats(userId, PERIOD_TYPES.ALL_TIME);
    }

    return stats;
  }

  /**
   * Get weekly statistics
   * @param {string} userId - User ID
   * @returns {Object} Weekly stats
   */
  async getWeeklyStats(userId) {
    const stats = await this.calculateStats(userId, PERIOD_TYPES.WEEKLY);
    return stats;
  }

  /**
   * Get monthly statistics
   * @param {string} userId - User ID
   * @returns {Object} Monthly stats
   */
  async getMonthlyStats(userId) {
    const stats = await this.calculateStats(userId, PERIOD_TYPES.MONTHLY);
    return stats;
  }

  /**
   * Get yearly statistics
   * @param {string} userId - User ID
   * @returns {Object} Yearly stats
   */
  async getYearlyStats(userId) {
    const stats = await this.calculateStats(userId, PERIOD_TYPES.YEARLY);
    return stats;
  }

  /**
   * Get comprehensive stats overview
   * @param {string} userId - User ID
   * @returns {Object} All stats
   */
  async getStatsOverview(userId) {
    const [allTime, weekly, monthly, yearly] = await Promise.all([
      this.getAllTimeStats(userId),
      this.getWeeklyStats(userId),
      this.getMonthlyStats(userId),
      this.getYearlyStats(userId),
    ]);

    return {
      allTime,
      weekly,
      monthly,
      yearly,
    };
  }

  /**
   * Refresh all stats for a user
   * @param {string} userId - User ID
   * @returns {Object} Updated stats
   */
  async refreshAllStats(userId) {
    const periodTypes = [
      PERIOD_TYPES.ALL_TIME,
      PERIOD_TYPES.WEEKLY,
      PERIOD_TYPES.MONTHLY,
      PERIOD_TYPES.YEARLY,
    ];

    const results = await Promise.all(
      periodTypes.map((type) => this.calculateStats(userId, type))
    );

    return {
      allTime: results[0],
      weekly: results[1],
      monthly: results[2],
      yearly: results[3],
    };
  }
}

module.exports = new StatsService();
