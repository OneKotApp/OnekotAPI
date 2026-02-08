/**
 * AI Health Controller
 * Handles AI-powered run analysis, health insights, weekly reports, and voice interactions
 */

const geminiService = require('../services/geminiService');
const voiceAgentService = require('../services/voiceAgentService');
const runService = require('../services/runService');
const statsService = require('../services/statsService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');

class AIHealthController {
  /**
   * Analyze a specific run and get health insights
   * POST /api/v1/ai/analyze-run/:runId
   */
  analyzeRun = asyncHandler(async (req, res) => {
    const { runId } = req.params;

    // Get the run data
    const run = await runService.getRunById(runId, req.userId);
    
    if (!run) {
      throw ApiError.notFound('Run not found');
    }

    // Analyze the run using Gemini
    const analysis = await geminiService.analyzeRun(run);

    const response = ApiResponse.success('Run analysis completed', {
      runId: run.id,
      analysis: analysis.analysis,
      runStats: analysis.runStats,
      healthBenefits: analysis.healthBenefits,
      traceId: analysis.traceId,
      generationTime: `${analysis.generationTime}ms`,
    });

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get health analysis for a run (with run data in body)
   * POST /api/v1/ai/analyze-run
   */
  analyzeRunData = asyncHandler(async (req, res) => {
    const runData = req.body;

    if (!runData || !runData.distance || !runData.duration) {
      throw ApiError.badRequest('Run data with distance and duration is required');
    }

    // Analyze the run using Gemini
    const analysis = await geminiService.analyzeRun(runData);

    const response = ApiResponse.success('Run analysis completed', {
      analysis: analysis.analysis,
      runStats: analysis.runStats,
      healthBenefits: analysis.healthBenefits,
      traceId: analysis.traceId,
      generationTime: `${analysis.generationTime}ms`,
    });

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Generate weekly health report
   * GET /api/v1/ai/weekly-report
   */
  getWeeklyReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    // Calculate date range for the week
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get runs for the week
    const runs = await runService.getRunsByDateRange(req.userId, start.toISOString(), end.toISOString());

    if (!runs || runs.length === 0) {
      const response = ApiResponse.success('No runs found for the specified week', {
        weekRange: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
        totalRuns: 0,
        message: 'Start running to get your weekly health report!',
      });
      return res.status(response.statusCode).json(response.toJSON());
    }

    // Get user's overall stats
    let userStats = {};
    try {
      const allTimeStats = await statsService.getStatsByPeriod(req.userId, 'all_time');
      if (allTimeStats) {
        userStats = {
          totalAllTimeDistance: allTimeStats.totalDistance,
          totalAllTimeRuns: allTimeStats.totalRuns,
          averageSpeed: allTimeStats.averageSpeed,
        };
      }
    } catch (error) {
      console.warn('Could not fetch user stats:', error.message);
    }

    // Generate weekly report
    const report = await geminiService.generateWeeklyReport(runs, userStats);

    const response = ApiResponse.success('Weekly health report generated', {
      weekRange: report.weeklyStats.weekRange,
      report: report.report,
      weeklyStats: report.weeklyStats,
      healthAnalysis: report.healthAnalysis,
      improvementPoints: report.improvementPoints,
      traceId: report.traceId,
      generationTime: `${report.generationTime}ms`,
    });

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get personalized health tips
   * GET /api/v1/ai/health-tips
   */
  getHealthTips = asyncHandler(async (req, res) => {
    // Calculate weekly stats for tips
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const runs = await runService.getRunsByDateRange(req.userId, start.toISOString(), end.toISOString());

    const weeklyDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const weeklyRuns = runs.length;
    const avgSpeed = runs.length > 0 
      ? runs.reduce((sum, run) => sum + run.averageSpeed, 0) / runs.length 
      : 0;

    const stats = {
      weeklyDistance,
      weeklyRuns,
      averageSpeed: avgSpeed,
    };

    const tips = await geminiService.getHealthTips(stats);

    const response = ApiResponse.success('Health tips generated', {
      tips: tips.tips,
      activityLevel: tips.activityLevel,
      traceId: tips.traceId,
    });

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Voice query for health assistant
   * POST /api/v1/ai/voice/query
   */
  voiceQuery = asyncHandler(async (req, res) => {
    const { transcript, audioData, runId } = req.body;

    if (!transcript && !audioData) {
      throw ApiError.badRequest('Either transcript or audioData is required');
    }

    // Build context
    const context = {};

    // Get recent runs for context
    try {
      const recentRuns = await runService.getRecentRuns(req.userId, 5);
      context.recentRuns = recentRuns;
    } catch (error) {
      console.warn('Could not fetch recent runs:', error.message);
    }

    // Get user stats for context
    try {
      const stats = await statsService.getStatsByPeriod(req.userId, 'weekly');
      if (stats) {
        context.stats = stats;
      }
    } catch (error) {
      console.warn('Could not fetch user stats:', error.message);
    }

    // If a specific run is mentioned
    if (runId) {
      try {
        const run = await runService.getRunById(runId, req.userId);
        context.currentRun = run;
      } catch (error) {
        console.warn('Could not fetch specified run:', error.message);
      }
    }

    let userTranscript = transcript;

    // If audio data is provided, convert to text first
    if (audioData && !transcript) {
      const sttResult = await voiceAgentService.speechToText(audioData);
      userTranscript = sttResult.text;
    }

    // Process voice query
    const voiceResponse = await geminiService.processVoiceQuery(userTranscript, context);

    const response = ApiResponse.success('Voice query processed', {
      query: userTranscript,
      response: voiceResponse.response,
      ssmlResponse: voiceResponse.ssmlResponse,
      traceId: voiceResponse.traceId,
      generationTime: `${voiceResponse.generationTime}ms`,
    });

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Full voice interaction (audio in -> audio out)
   * POST /api/v1/ai/voice/interact
   */
  voiceInteract = asyncHandler(async (req, res) => {
    const { audioData, runId, voiceId } = req.body;

    if (!audioData) {
      throw ApiError.badRequest('Audio data is required');
    }

    // Validate audio format
    const validation = voiceAgentService.validateAudioFormat(audioData);
    if (!validation.valid) {
      throw ApiError.badRequest(`Invalid audio format: ${validation.format}`);
    }

    // Build context
    const context = {};

    try {
      const recentRuns = await runService.getRecentRuns(req.userId, 5);
      context.recentRuns = recentRuns;
    } catch (error) {
      console.warn('Could not fetch recent runs:', error.message);
    }

    try {
      const stats = await statsService.getStatsByPeriod(req.userId, 'weekly');
      if (stats) {
        context.stats = stats;
      }
    } catch (error) {
      console.warn('Could not fetch user stats:', error.message);
    }

    if (runId) {
      try {
        const run = await runService.getRunById(runId, req.userId);
        context.currentRun = run;
      } catch (error) {
        console.warn('Could not fetch specified run:', error.message);
      }
    }

    // Process complete voice interaction
    const result = await voiceAgentService.processVoiceInteraction(
      audioData,
      async (transcript) => {
        return await geminiService.processVoiceQuery(transcript, context);
      },
      context
    );

    if (!result.success) {
      throw ApiError.internal(`Voice interaction failed: ${result.error}`);
    }

    const response = ApiResponse.success('Voice interaction completed', {
      transcript: result.transcript,
      aiResponse: result.aiResponse?.response || result.aiResponse,
      audio: result.audioResponse?.audio,
      audioFormat: result.audioResponse?.format,
      metrics: result.metrics,
    });

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Text to speech conversion
   * POST /api/v1/ai/voice/tts
   */
  textToSpeech = asyncHandler(async (req, res) => {
    const { text, voiceId } = req.body;

    if (!text) {
      throw ApiError.badRequest('Text is required');
    }

    const ttsResult = await voiceAgentService.textToSpeech(text, { voiceId });

    if (!ttsResult.success) {
      // Return text for client-side TTS fallback
      const response = ApiResponse.success('TTS not available, returning text', {
        text,
        audio: null,
        fallback: true,
        error: ttsResult.error,
      });
      return res.status(response.statusCode).json(response.toJSON());
    }

    const response = ApiResponse.success('Text to speech completed', {
      audio: ttsResult.audio,
      format: ttsResult.format,
      duration: `${ttsResult.duration}ms`,
      textLength: ttsResult.textLength,
    });

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Speech to text conversion
   * POST /api/v1/ai/voice/stt
   */
  speechToText = asyncHandler(async (req, res) => {
    const { audioData, audioUrl, language } = req.body;

    if (!audioData && !audioUrl) {
      throw ApiError.badRequest('Either audioData or audioUrl is required');
    }

    const sttResult = await voiceAgentService.speechToText(audioUrl || audioData, {
      language,
      audioDuration: req.body.audioDuration,
    });

    const response = ApiResponse.success('Speech to text completed', {
      text: sttResult.text,
      confidence: sttResult.confidence,
      words: sttResult.words,
      duration: `${sttResult.duration}ms`,
    });

    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get available TTS voices
   * GET /api/v1/ai/voice/voices
   */
  getVoices = asyncHandler(async (req, res) => {
    const voices = voiceAgentService.getAvailableVoices();

    const response = ApiResponse.success('Available voices', { voices });
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Submit feedback for AI response
   * POST /api/v1/ai/feedback
   */
  submitFeedback = asyncHandler(async (req, res) => {
    const { traceId, rating, comment } = req.body;

    if (!traceId || rating === undefined) {
      throw ApiError.badRequest('traceId and rating are required');
    }

    if (rating < 1 || rating > 5) {
      throw ApiError.badRequest('Rating must be between 1 and 5');
    }

    const result = await geminiService.submitFeedback(traceId, rating, comment);

    const response = ApiResponse.success('Feedback submitted', result);
    res.status(response.statusCode).json(response.toJSON());
  });

  /**
   * Get AI service status
   * GET /api/v1/ai/status
   */
  getStatus = asyncHandler(async (req, res) => {
    const opikService = require('../services/opikService');

    const status = {
      gemini: {
        initialized: geminiService.isInitialized,
        model: 'gemini-1.5-flash',
      },
      voice: {
        stt: !!process.env.ASSEMBLYAI_API_KEY,
        tts: !!process.env.CARTESIA_API_KEY,
      },
      opik: opikService.getAnalyticsSummary(),
    };

    const response = ApiResponse.success('AI service status', status);
    res.status(response.statusCode).json(response.toJSON());
  });
}

module.exports = new AIHealthController();
