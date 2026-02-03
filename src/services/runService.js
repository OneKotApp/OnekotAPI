const Run = require('../models/Run');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateRunId, calculatePagination } = require('../utils/helpers');
const { MESSAGES, PAGINATION } = require('../utils/constants');

class RunService {
  /**
   * Calculate geographic center point of a route
   * Used for geospatial indexing and efficient location queries
   * @param {Array} route - Array of lat/lng points
   * @returns {Object} GeoJSON Point { type: 'Point', coordinates: [lng, lat] }
   */
  calculateRouteCenter(route) {
    if (!route || route.length === 0) return null;

    // Calculate centroid (geographic center)
    const sumLat = route.reduce((sum, point) => sum + point.latitude, 0);
    const sumLng = route.reduce((sum, point) => sum + point.longitude, 0);
    
    const centerLat = sumLat / route.length;
    const centerLng = sumLng / route.length;

    // GeoJSON format: [longitude, latitude] (note: lng comes first!)
    return {
      type: 'Point',
      coordinates: [centerLng, centerLat],
    };
  }

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

      // Calculate geographic center for geospatial queries
      const location = this.calculateRouteCenter(runData.route);

      // Prepare run document
      const run = await Run.create({
        id: runId,
        userId,
        startTime: new Date(runData.startTime),
        endTime: new Date(runData.endTime),
        distance: runData.distance,
        area: runData.area || null,
        totalArea: runData.totalArea || null,
        duration: runData.duration,
        averageSpeed: runData.averageSpeed,
        maxSpeed: runData.maxSpeed || 0,
        notes: runData.notes || null,
        location, // GeoJSON Point for geospatial indexing
        route: runData.route.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: new Date(point.timestamp),
          altitude: point.altitude || null,
          accuracy: point.accuracy || null,
        })),
      });

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

          // Calculate geographic center for geospatial queries
          const location = this.calculateRouteCenter(runData.route);

          // Prepare run document
          const run = await Run.create({
            id: runId,
            userId,
            startTime: new Date(runData.startTime),
            endTime: new Date(runData.endTime),
            distance: runData.distance,
            area: runData.area || null,
            totalArea: runData.totalArea || null,
            duration: runData.duration,
            averageSpeed: runData.averageSpeed,
            maxSpeed: runData.maxSpeed || 0,
            notes: runData.notes || null,
            location, // GeoJSON Point for geospatial indexing
            route: runData.route.map((point) => ({
              latitude: point.latitude,
              longitude: point.longitude,
              timestamp: new Date(point.timestamp),
              altitude: point.altitude || null,
              accuracy: point.accuracy || null,
            })),
          });

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
   * OPTIMIZED with MongoDB 2dsphere geospatial indexing
   * Performance: O(log n) instead of O(n) for location queries
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
      // Build base query
      const query = {
        isDeleted: false,
      };

      // Apply geospatial filter using 2dsphere index (FAST!)
      if (boundingBox) {
        const { minLat, maxLat, minLng, maxLng } = boundingBox;
        
        // MongoDB $geoWithin query - leverages 2dsphere index
        // This is O(log n) vs O(n) for array scanning
        query.location = {
          $geoWithin: {
            $box: [
              [minLng, minLat], // Southwest corner [longitude, latitude]
              [maxLng, maxLat]  // Northeast corner
            ]
          }
        };
      }

      const runs = await Run.find(query)
        .select('id userId startTime endTime distance area totalArea duration route location createdAt')
        .populate('userId', 'username email runColor')
        .sort({ startTime: -1 })
        .limit(Math.min(parseInt(limit), PAGINATION.MAX_LIMIT))
        .skip((parseInt(page) - 1) * Math.min(parseInt(limit), PAGINATION.MAX_LIMIT))
        .lean();

      // Transform the response to include username and runColor at top level
      const transformedRuns = runs.map(run => ({
        ...run,
        username: run.userId?.username || 'Runner',
        runColor: run.userId?.runColor || '#FF6B6B',
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
    const run = await Run.findOne({ id: runId, userId }).select('route');

    if (!run) {
      throw ApiError.notFound(MESSAGES.RUN_NOT_FOUND);
    }

    return run.route || [];
  }

  /**
   * Get leaderboard by total area coverage with pagination
   * @param {Object} options - Query options
   * @returns {Object} Leaderboard data with rankings
   */
  async getAreaLeaderboard(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = options;

    try {
      // Aggregate runs by user and total area covered
      const pipeline = [
        {
          $match: {
            isDeleted: false,
            totalArea: { $ne: null, $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$userId',
            totalAreaCovered: { $sum: '$totalArea' },
            totalRuns: { $sum: 1 },
            totalDistance: { $sum: '$distance' },
          },
        },
        {
          $sort: { totalAreaCovered: -1 },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            username: '$user.username',
            email: '$user.email',
            totalAreaCovered: 1,
            totalRuns: 1,
            totalDistance: 1,
            averageArea: { $divide: ['$totalAreaCovered', '$totalRuns'] },
          },
        },
      ];

      // Get total count for pagination
      const countPipeline = [
        {
          $match: {
            isDeleted: false,
            totalArea: { $ne: null, $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$userId',
          },
        },
        {
          $count: 'total',
        },
      ];

      const totalResults = await Run.aggregate(countPipeline);
      const totalItems = totalResults.length > 0 ? totalResults[0].total : 0;

      // Apply pagination
      const skip = (parseInt(page) - 1) * Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
      pipeline.push(
        { $skip: skip },
        { $limit: Math.min(parseInt(limit), PAGINATION.MAX_LIMIT) }
      );

      const leaderboard = await Run.aggregate(pipeline);

      // Add ranking index
      const rankedLeaderboard = leaderboard.map((item, index) => ({
        rank: skip + index + 1,
        ...item,
      }));

      const pagination = calculatePagination(totalItems, parseInt(page), parseInt(limit));

      return {
        leaderboard: rankedLeaderboard,
        pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get leaderboard by distance with pagination
   * @param {Object} options - Query options
   * @returns {Object} Leaderboard data with rankings
   */
  async getDistanceLeaderboard(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = options;

    try {
      // Aggregate runs by user and total distance
      const pipeline = [
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$userId',
            totalDistance: { $sum: '$distance' },
            totalRuns: { $sum: 1 },
            totalDuration: { $sum: '$duration' },
          },
        },
        {
          $sort: { totalDistance: -1 },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            username: '$userInfo.username',
            email: '$userInfo.email',
            runColor: '$userInfo.runColor',
            totalDistance: 1,
            totalRuns: 1,
            totalDuration: 1,
          },
        },
      ];

      // Get total count for pagination
      const totalResults = await Run.aggregate([
        ...pipeline.slice(0, 1),
        {
          $group: {
            _id: '$userId',
          },
        },
        { $count: 'total' },
      ]);
      const totalItems = totalResults.length > 0 ? totalResults[0].total : 0;

      // Apply pagination
      const skip = (parseInt(page) - 1) * Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
      pipeline.push(
        { $skip: skip },
        { $limit: Math.min(parseInt(limit), PAGINATION.MAX_LIMIT) }
      );

      const leaderboard = await Run.aggregate(pipeline);

      // Add ranking index
      const rankedLeaderboard = leaderboard.map((item, index) => ({
        rank: skip + index + 1,
        ...item,
      }));

      const pagination = calculatePagination(totalItems, parseInt(page), parseInt(limit));

      return {
        leaderboard: rankedLeaderboard,
        pagination,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RunService();
