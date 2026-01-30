const Run = require('../models/Run');
const LocationPoint = require('../models/LocationPoint');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateRunId, calculatePagination } = require('../utils/helpers');
const { MESSAGES, PAGINATION } = require('../utils/constants');

class RunService {
  /**
   * Create a new run session
   * @param {string} userId - User ID
   * @param {Object} runData - Run session data
   * @returns {Object} Created run
   */
  async createRun(userId, runData) {
    try {
      // Generate unique ID if not provided
      const runId = runData.id || generateRunId();

      // Prepare run document
      const run = await Run.create({
        id: runId,
        userId,
        startTime: new Date(runData.startTime),
        endTime: new Date(runData.endTime),
        distance: runData.distance,
        duration: runData.duration,
        averageSpeed: runData.averageSpeed,
        maxSpeed: runData.maxSpeed || 0,
        notes: runData.notes || null,
        route: runData.route.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: new Date(point.timestamp),
          altitude: point.altitude || null,
          accuracy: point.accuracy || null,
        })),
      });

      // Also store location points in separate collection for advanced queries
      if (runData.route && runData.route.length > 0) {
        await LocationPoint.bulkInsertPoints(runId, userId, runData.route);
      }

      // Update user metadata
      const user = await User.findById(userId);
      if (user) {
        await user.updateMetadata({
          distance: runData.distance,
          duration: runData.duration,
        });
      }

      return run;
    } catch (error) {
      if (error.code === 11000) {
        throw ApiError.conflict('Run with this ID already exists');
      }
      throw error;
    }
  }

  /**
   * Bulk create multiple runs (for offline sync)
   * @param {string} userId - User ID
   * @param {Array} runsData - Array of run session data
   * @returns {Object} Created runs and failed runs
   */
  async bulkCreateRuns(userId, runsData) {
    const results = {
      successful: [],
      failed: [],
      summary: {
        total: runsData.length,
        created: 0,
        skipped: 0,
        errors: 0,
      },
    };

    try {
      for (const runData of runsData) {
        try {
          // Generate unique ID if not provided
          const runId = runData.id || generateRunId();

          // Check if run already exists
          const existingRun = await Run.findOne({ id: runId, userId });
          if (existingRun) {
            results.failed.push({
              id: runId,
              reason: 'Run already exists',
              data: runData,
            });
            results.summary.skipped++;
            continue;
          }

          // Prepare run document
          const run = await Run.create({
            id: runId,
            userId,
            startTime: new Date(runData.startTime),
            endTime: new Date(runData.endTime),
            distance: runData.distance,
            duration: runData.duration,
            averageSpeed: runData.averageSpeed,
            maxSpeed: runData.maxSpeed || 0,
            notes: runData.notes || null,
            route: runData.route.map((point) => ({
              latitude: point.latitude,
              longitude: point.longitude,
              timestamp: new Date(point.timestamp),
              altitude: point.altitude || null,
              accuracy: point.accuracy || null,
            })),
          });

          // Store location points in separate collection
          if (runData.route && runData.route.length > 0) {
            await LocationPoint.bulkInsertPoints(runId, userId, runData.route);
          }

          results.successful.push(run);
          results.summary.created++;
        } catch (error) {
          results.failed.push({
            id: runData.id || 'unknown',
            reason: error.message,
            data: runData,
          });
          results.summary.errors++;
        }
      }

      // Update user metadata based on successful runs
      if (results.successful.length > 0) {
        const totalDistance = results.successful.reduce((sum, run) => sum + run.distance, 0);
        const totalDuration = results.successful.reduce((sum, run) => sum + run.duration, 0);

        const user = await User.findById(userId);
        if (user) {
          await user.updateMetadata({
            distance: totalDistance,
            duration: totalDuration,
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all runs for a user with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Runs and pagination data
   */
  async getUserRuns(userId, options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      includeDeleted = false,
    } = options;

    const runs = await Run.getUserRuns(userId, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), PAGINATION.MAX_LIMIT),
      includeDeleted,
    });

    const totalItems = await Run.countDocuments({
      userId,
      ...(includeDeleted ? {} : { isDeleted: false }),
    });

    const pagination = calculatePagination(totalItems, parseInt(page), parseInt(limit));

    return {
      runs,
      pagination,
    };
  }

  /**
   * Get a specific run by ID
   * @param {string} runId - Run ID
   * @param {string} userId - User ID for authorization
   * @returns {Object} Run data
   */
  async getRunById(runId, userId) {
    const run = await Run.findOne({ id: runId, userId, isDeleted: false });

    if (!run) {
      throw ApiError.notFound(MESSAGES.RUN_NOT_FOUND);
    }

    return run;
  }

  /**
   * Get all community runs for map plotting (all users)
   * @param {Object} options - Query options
   * @returns {Object} Runs and pagination data
   */
  async getCommunityRuns(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      boundingBox = null,
    } = options;

    try {
      // Build query
      const query = {
        isDeleted: false,
        'route.0': { $exists: true }, // Ensure route has at least one point
      };

      // Apply bounding box filter if provided
      if (boundingBox) {
        const { minLat, maxLat, minLng, maxLng } = boundingBox;
        query['route.latitude'] = {
          $gte: minLat,
          $lte: maxLat,
        };
        query['route.longitude'] = {
          $gte: minLng,
          $lte: maxLng,
        };
      }

      const runs = await Run.find(query)
        .select('id userId startTime endTime distance duration route createdAt')
        .populate('userId', 'username email') // Populate username and email from User
        .sort({ startTime: -1 })
        .limit(Math.min(parseInt(limit), PAGINATION.MAX_LIMIT))
        .skip((parseInt(page) - 1) * Math.min(parseInt(limit), PAGINATION.MAX_LIMIT))
        .lean();

      // Transform the response to include username at top level
      const transformedRuns = runs.map(run => ({
        ...run,
        username: run.userId?.username || 'Anonymous',
        userId: run.userId?._id || run.userId, // Keep userId as string ID
      }));

      const totalItems = await Run.countDocuments(query);
      const pagination = calculatePagination(totalItems, parseInt(page), parseInt(limit));

      return {
        runs: transformedRuns,
        pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get runs within a date range
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Runs within date range
   */
  async getRunsByDateRange(userId, startDate, endDate) {
    if (new Date(endDate) <= new Date(startDate)) {
      throw ApiError.badRequest(MESSAGES.INVALID_DATE_RANGE);
    }

    const runs = await Run.getRunsByDateRange(userId, startDate, endDate);
    return runs;
  }

  /**
   * Update run notes
   * @param {string} runId - Run ID
   * @param {string} userId - User ID for authorization
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated run
   */
  async updateRun(runId, userId, updateData) {
    const run = await Run.findOne({ id: runId, userId, isDeleted: false });

    if (!run) {
      throw ApiError.notFound(MESSAGES.RUN_NOT_FOUND);
    }

    // Only allow updating notes for now
    if (updateData.notes !== undefined) {
      run.notes = updateData.notes;
    }

    await run.save();
    return run;
  }

  /**
   * Soft delete a run
   * @param {string} runId - Run ID
   * @param {string} userId - User ID for authorization
   * @returns {Object} Success message
   */
  async deleteRun(runId, userId) {
    const run = await Run.findOne({ id: runId, userId, isDeleted: false });

    if (!run) {
      throw ApiError.notFound(MESSAGES.RUN_NOT_FOUND);
    }

    run.isDeleted = true;
    await run.save();

    // Update user metadata
    const user = await User.findById(userId);
    if (user && user.metadata) {
      user.metadata.totalRuns = Math.max(0, user.metadata.totalRuns - 1);
      user.metadata.totalDistance = Math.max(0, user.metadata.totalDistance - run.distance);
      user.metadata.totalDuration = Math.max(0, user.metadata.totalDuration - run.duration);
      await user.save();
    }

    return { message: MESSAGES.RUN_DELETED };
  }

  /**
   * Get recent runs for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of runs to fetch
   * @returns {Array} Recent runs
   */
  async getRecentRuns(userId, limit = 10) {
    const runs = await Run.find({ userId, isDeleted: false })
      .sort({ startTime: -1 })
      .limit(Math.min(limit, PAGINATION.MAX_LIMIT))
      .select('-__v');

    return runs;
  }

  /**
   * Get location points for a run
   * @param {string} runId - Run ID
   * @param {string} userId - User ID for authorization
   * @returns {Array} Location points
   */
  async getRunLocationPoints(runId, userId) {
    // Verify run exists and belongs to user
    const run = await Run.findOne({ id: runId, userId });

    if (!run) {
      throw ApiError.notFound(MESSAGES.RUN_NOT_FOUND);
    }

    const points = await LocationPoint.getPointsByRunId(runId);
    return points;
  }
}

module.exports = new RunService();
