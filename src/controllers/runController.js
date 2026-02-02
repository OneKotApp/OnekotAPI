const runService = require('../services/runService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const { MESSAGES } = require('../utils/constants');

class RunController {
  /**
   * Create a new run session
   * POST /api/v1/runs
   */
  createRun = asyncHandler(async (req, res) => {
    const run = await runService.createRun(req.userId, req.body);

    const response = ApiResponse.created(MESSAGES.RUN_CREATED, { run });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get all runs for the authenticated user
   * GET /api/v1/runs
   */
  getUserRuns = asyncHandler(async (req, res) => {
    const { page, limit, includeDeleted } = req.query;

    const result = await runService.getUserRuns(req.userId, {
      page,
      limit,
      includeDeleted: includeDeleted === 'true',
    });

    const response = ApiResponse.withPagination(
      MESSAGES.RUNS_FETCHED,
      result.runs,
      result.pagination
    );

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get a specific run by ID
   * GET /api/v1/runs/:id
   */
  getRunById = asyncHandler(async (req, res) => {
    const run = await runService.getRunById(req.params.id, req.userId);

    const response = ApiResponse.success(MESSAGES.RUN_FETCHED, { run });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get runs by date range
   * GET /api/v1/runs/date-range
   */
  getRunsByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const runs = await runService.getRunsByDateRange(req.userId, startDate, endDate);

    const response = ApiResponse.success(MESSAGES.RUNS_FETCHED, { runs, count: runs.length });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get recent runs
   * GET /api/v1/runs/recent
   */
  getRecentRuns = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const runs = await runService.getRecentRuns(req.userId, parseInt(limit));

    const response = ApiResponse.success(MESSAGES.RUNS_FETCHED, { runs, count: runs.length });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Update a run (notes only)
   * PATCH /api/v1/runs/:id
   */
  updateRun = asyncHandler(async (req, res) => {
    const run = await runService.updateRun(req.params.id, req.userId, req.body);

    const response = ApiResponse.success(MESSAGES.RUN_UPDATED, { run });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Delete a run (soft delete)
   * DELETE /api/v1/runs/:id
   */
  deleteRun = asyncHandler(async (req, res) => {
    const result = await runService.deleteRun(req.params.id, req.userId);

    const response = ApiResponse.success(result.message);
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Bulk sync multiple runs (for offline data)
   * POST /api/v1/runs/bulk-sync
   */
  bulkSyncRuns = asyncHandler(async (req, res) => {
    const { runs } = req.body;

    if (!runs || !Array.isArray(runs) || runs.length === 0) {
      throw ApiError.badRequest('Runs array is required and must not be empty');
    }

    const result = await runService.bulkCreateRuns(req.userId, runs);

    const response = ApiResponse.success(
      `Bulk sync completed: ${result.summary.created} created, ${result.summary.skipped} skipped, ${result.summary.errors} errors`,
      result
    );

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get location points for a specific run
   * GET /api/v1/runs/:id/location-points
   */
  getRunLocationPoints = asyncHandler(async (req, res) => {
    const points = await runService.getRunLocationPoints(req.params.id, req.userId);

    const response = ApiResponse.success('Location points fetched successfully', {
      points,
      count: points.length,
    });

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get all community runs for map (all users)
   * GET /api/v1/runs/community-map
   */
  getCommunityRuns = asyncHandler(async (req, res) => {
    const { page, limit, minLat, maxLat, minLng, maxLng } = req.query;

    // Parse bounding box if provided
    let boundingBox = null;
    if (minLat && maxLat && minLng && maxLng) {
      boundingBox = {
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLng: parseFloat(minLng),
        maxLng: parseFloat(maxLng),
      };
    }

    const result = await runService.getCommunityRuns({
      page,
      limit,
      boundingBox,
    });

    const response = ApiResponse.withPagination(
      'Community runs fetched successfully',
      result.runs,
      result.pagination
    );

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get area leaderboard
   * GET /api/v1/runs/leaderboard/area
   */
  getAreaLeaderboard = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    const result = await runService.getAreaLeaderboard({
      page,
      limit,
    });

    const response = ApiResponse.withPagination(
      'Area leaderboard fetched successfully',
      result.leaderboard,
      result.pagination
    );

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get distance leaderboard
   * GET /api/v1/runs/leaderboard/distance
   */
  getDistanceLeaderboard = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    const result = await runService.getDistanceLeaderboard({
      page,
      limit,
    });

    const response = ApiResponse.withPagination(
      'Distance leaderboard fetched successfully',
      result.leaderboard,
      result.pagination
    );

    res.status(response.statusCode).json(response.toJSON());
  });
}

module.exports = new RunController();
