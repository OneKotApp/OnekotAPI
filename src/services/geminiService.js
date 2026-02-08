/**
 * Gemini AI Service
 * Provides AI-powered run analysis, health insights, and voice interactions
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const opikService = require('./opikService');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Gemini AI client
   */
  initialize() {
    try {
      if (!process.env.GOOGLE_API_KEY) {
        console.warn('⚠️ Google API key not configured. Gemini AI disabled.');
        return;
      }

      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isInitialized = true;
      console.log('✅ Gemini AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error.message);
    }
  }

  /**
   * Generate AI response with Opik tracing
   * @param {string} prompt - Input prompt
   * @param {string} type - Type of generation (analysis, report, voice, etc.)
   * @param {Object} metadata - Additional metadata for tracing
   * @returns {Object} Generated response with trace info
   */
  async generateResponse(prompt, type = 'general', metadata = {}) {
    if (!this.isInitialized) {
      throw new Error('Gemini AI service not initialized');
    }

    const startTime = Date.now();
    const trace = await opikService.createTrace(`gemini_${type}`, {
      type,
      ...metadata,
    });

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      const duration = Date.now() - startTime;

      // Log generation to Opik
      await opikService.logGeneration(trace, {
        input: prompt.substring(0, 500), // Truncate for logging
        output: text.substring(0, 500),
        model: 'gemini-1.5-flash',
        duration,
        tokens: text.length, // Approximate
        type,
      });

      // Log evaluation metrics
      await opikService.logEvaluation(trace, {
        response_length: text.length,
        generation_time_ms: duration,
        type,
        success: true,
      });

      await opikService.endTrace(trace);

      return {
        text,
        duration,
        traceId: trace?.id,
        success: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      await opikService.logEvaluation(trace, {
        error: error.message,
        generation_time_ms: duration,
        type,
        success: false,
      });

      await opikService.endTrace(trace);

      throw error;
    }
  }

  /**
   * Analyze a single run and provide health insights
   * @param {Object} runData - Run data object
   * @returns {Object} Analysis result
   */
  async analyzeRun(runData) {
    const prompt = this.buildRunAnalysisPrompt(runData);
    const response = await this.generateResponse(prompt, 'run_analysis', {
      runId: runData.id,
      distance: runData.distance,
      duration: runData.duration,
    });

    return {
      analysis: response.text,
      runStats: this.extractRunStats(runData),
      healthBenefits: this.parseHealthBenefits(response.text),
      traceId: response.traceId,
      generationTime: response.duration,
    };
  }

  /**
   * Build prompt for run analysis
   */
  buildRunAnalysisPrompt(runData) {
    const distanceKm = (runData.distance / 1000).toFixed(2);
    const durationMinutes = (runData.duration / 60).toFixed(1);
    const paceMinPerKm = runData.distance > 0 
      ? ((runData.duration / 60) / (runData.distance / 1000)).toFixed(2) 
      : 'N/A';
    const avgSpeedKmh = (runData.averageSpeed * 3.6).toFixed(2);

    return `
You are a professional running coach and health expert. Analyze the following run data and provide comprehensive insights.

## Run Data:
- **Distance**: ${distanceKm} km (${runData.distance} meters)
- **Duration**: ${durationMinutes} minutes (${runData.duration} seconds)
- **Average Speed**: ${avgSpeedKmh} km/h
- **Max Speed**: ${(runData.maxSpeed * 3.6).toFixed(2)} km/h
- **Pace**: ${paceMinPerKm} min/km
- **Date**: ${new Date(runData.startTime).toLocaleDateString()}
- **Time**: ${new Date(runData.startTime).toLocaleTimeString()} - ${new Date(runData.endTime).toLocaleTimeString()}
${runData.area ? `- **Area**: ${runData.area}` : ''}
${runData.notes ? `- **Notes**: ${runData.notes}` : ''}
${runData.route?.length ? `- **Route Points**: ${runData.route.length} GPS points recorded` : ''}

Please provide:

### 1. Run Performance Analysis
Analyze the run performance including pace consistency, speed metrics, and overall effort level.

### 2. Health Benefits
List specific health benefits the user gained from this run, including:
- Cardiovascular benefits
- Calories burned (estimated)
- Mental health benefits
- Muscle groups worked
- Endurance improvements

### 3. Personalized Recommendations
Provide 3-5 actionable recommendations to improve future runs.

### 4. Recovery Suggestions
Suggest recovery activities and nutrition tips post-run.

### 5. Motivation & Encouragement
End with encouraging words based on their performance.

Format your response in clear sections with headers.
`;
  }

  /**
   * Extract run statistics
   */
  extractRunStats(runData) {
    const distanceKm = runData.distance / 1000;
    const durationMinutes = runData.duration / 60;
    const paceMinPerKm = distanceKm > 0 ? durationMinutes / distanceKm : 0;
    const avgSpeedKmh = runData.averageSpeed * 3.6;
    const maxSpeedKmh = runData.maxSpeed * 3.6;

    // Estimate calories (rough calculation: ~60 calories per km for average person)
    const estimatedCalories = Math.round(distanceKm * 60);

    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      distanceMeters: runData.distance,
      durationMinutes: parseFloat(durationMinutes.toFixed(1)),
      durationSeconds: runData.duration,
      paceMinPerKm: parseFloat(paceMinPerKm.toFixed(2)),
      avgSpeedKmh: parseFloat(avgSpeedKmh.toFixed(2)),
      maxSpeedKmh: parseFloat(maxSpeedKmh.toFixed(2)),
      estimatedCalories,
      routePoints: runData.route?.length || 0,
      startTime: runData.startTime,
      endTime: runData.endTime,
      area: runData.area,
    };
  }

  /**
   * Parse health benefits from AI response
   */
  parseHealthBenefits(analysisText) {
    const benefits = [];
    const healthKeywords = [
      'cardiovascular', 'heart', 'calories', 'mental health', 'stress',
      'endurance', 'muscle', 'strength', 'flexibility', 'weight',
      'metabolism', 'sleep', 'energy', 'mood', 'immunity'
    ];

    healthKeywords.forEach(keyword => {
      if (analysisText.toLowerCase().includes(keyword)) {
        benefits.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    return [...new Set(benefits)]; // Remove duplicates
  }

  /**
   * Generate weekly health report
   * @param {Array} runs - Array of runs from the week
   * @param {Object} userStats - User statistics
   * @returns {Object} Weekly report
   */
  async generateWeeklyReport(runs, userStats = {}) {
    const weeklyStats = this.calculateWeeklyStats(runs);
    const prompt = this.buildWeeklyReportPrompt(runs, weeklyStats, userStats);
    
    const response = await this.generateResponse(prompt, 'weekly_report', {
      totalRuns: runs.length,
      totalDistance: weeklyStats.totalDistance,
      week: weeklyStats.weekRange,
    });

    return {
      report: response.text,
      weeklyStats,
      healthAnalysis: this.parseWeeklyHealthAnalysis(response.text),
      improvementPoints: this.parseImprovementPoints(response.text),
      traceId: response.traceId,
      generationTime: response.duration,
    };
  }

  /**
   * Calculate weekly statistics
   */
  calculateWeeklyStats(runs) {
    if (!runs || runs.length === 0) {
      return {
        totalRuns: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgDistance: 0,
        avgPace: 0,
        avgSpeed: 0,
        longestRun: 0,
        fastestPace: 0,
        totalCalories: 0,
        weekRange: 'No runs',
      };
    }

    const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const totalDuration = runs.reduce((sum, run) => sum + run.duration, 0);
    const avgSpeed = runs.reduce((sum, run) => sum + run.averageSpeed, 0) / runs.length;
    const longestRun = Math.max(...runs.map(run => run.distance));
    const fastestSpeed = Math.max(...runs.map(run => run.averageSpeed));

    const dates = runs.map(run => new Date(run.startTime)).sort((a, b) => a - b);
    const weekRange = `${dates[0].toLocaleDateString()} - ${dates[dates.length - 1].toLocaleDateString()}`;

    return {
      totalRuns: runs.length,
      totalDistance: parseFloat((totalDistance / 1000).toFixed(2)),
      totalDistanceMeters: totalDistance,
      totalDuration: parseFloat((totalDuration / 60).toFixed(1)),
      totalDurationSeconds: totalDuration,
      avgDistance: parseFloat((totalDistance / runs.length / 1000).toFixed(2)),
      avgPace: parseFloat(((totalDuration / 60) / (totalDistance / 1000)).toFixed(2)),
      avgSpeed: parseFloat((avgSpeed * 3.6).toFixed(2)),
      longestRun: parseFloat((longestRun / 1000).toFixed(2)),
      fastestSpeed: parseFloat((fastestSpeed * 3.6).toFixed(2)),
      totalCalories: Math.round((totalDistance / 1000) * 60),
      weekRange,
      runDays: new Set(runs.map(run => new Date(run.startTime).toDateString())).size,
    };
  }

  /**
   * Build prompt for weekly report
   */
  buildWeeklyReportPrompt(runs, weeklyStats, userStats) {
    const runDetails = runs.map((run, index) => {
      const distKm = (run.distance / 1000).toFixed(2);
      const durMin = (run.duration / 60).toFixed(1);
      const date = new Date(run.startTime).toLocaleDateString();
      return `  ${index + 1}. ${date}: ${distKm} km in ${durMin} min (${(run.averageSpeed * 3.6).toFixed(1)} km/h)`;
    }).join('\n');

    return `
You are a professional running coach and health expert. Generate a comprehensive weekly running and health report.

## Weekly Summary (${weeklyStats.weekRange})

### Run Statistics:
- **Total Runs**: ${weeklyStats.totalRuns}
- **Total Distance**: ${weeklyStats.totalDistance} km
- **Total Duration**: ${weeklyStats.totalDuration} minutes
- **Average Distance per Run**: ${weeklyStats.avgDistance} km
- **Average Pace**: ${weeklyStats.avgPace} min/km
- **Average Speed**: ${weeklyStats.avgSpeed} km/h
- **Longest Run**: ${weeklyStats.longestRun} km
- **Fastest Speed**: ${weeklyStats.fastestSpeed} km/h
- **Estimated Calories Burned**: ${weeklyStats.totalCalories} kcal
- **Active Days**: ${weeklyStats.runDays} days

### Individual Runs:
${runDetails}

${userStats.totalAllTimeDistance ? `### User's All-Time Stats:
- Total Distance: ${(userStats.totalAllTimeDistance / 1000).toFixed(1)} km
- Total Runs: ${userStats.totalAllTimeRuns || 'N/A'}
` : ''}

Please provide a comprehensive weekly report including:

### 1. Weekly Performance Summary
Analyze the overall weekly performance with trends and patterns.

### 2. Health Benefits Achieved
Detail the cumulative health benefits from this week's running:
- Cardiovascular improvements
- Estimated calories burned and weight management impact
- Mental health benefits
- Sleep quality improvements
- Stress reduction
- Immune system boost

### 3. Progress Analysis
Compare performance metrics and identify improvements or areas needing attention.

### 4. Improvement Points
List 5 specific, actionable improvement points for next week:
- Training suggestions
- Pacing strategies
- Recovery recommendations
- Nutrition tips

### 5. Weekly Health Score
Give a health score out of 100 based on:
- Consistency (running frequency)
- Distance covered
- Pace improvements
- Recovery adherence

### 6. Next Week's Goals
Suggest realistic goals for the upcoming week.

### 7. Motivational Insights
End with personalized encouragement based on the week's achievements.

Format the response with clear headers and bullet points for easy reading.
`;
  }

  /**
   * Parse weekly health analysis
   */
  parseWeeklyHealthAnalysis(reportText) {
    const sections = {
      performanceSummary: '',
      healthBenefits: [],
      weeklyScore: null,
    };

    // Extract health score if mentioned
    const scoreMatch = reportText.match(/(\d{1,3})\s*(?:\/\s*100|out of 100|points)/i);
    if (scoreMatch) {
      sections.weeklyScore = parseInt(scoreMatch[1]);
    }

    // Extract key health benefits
    const healthKeywords = [
      'cardiovascular', 'heart health', 'calories', 'weight', 'mental health',
      'stress reduction', 'sleep', 'energy', 'endurance', 'immunity',
      'metabolism', 'muscle strength', 'flexibility', 'mood', 'focus'
    ];

    healthKeywords.forEach(keyword => {
      if (reportText.toLowerCase().includes(keyword)) {
        sections.healthBenefits.push(keyword.split(' ').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' '));
      }
    });

    return sections;
  }

  /**
   * Parse improvement points from report
   */
  parseImprovementPoints(reportText) {
    const points = [];
    const lines = reportText.split('\n');
    
    let inImprovementSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('improvement') || line.toLowerCase().includes('recommendation')) {
        inImprovementSection = true;
        continue;
      }
      
      if (inImprovementSection && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
        const point = line.replace(/^[-•\d.]+\s*/, '').trim();
        if (point.length > 10 && point.length < 200) {
          points.push(point);
        }
      }
      
      if (inImprovementSection && line.startsWith('###')) {
        inImprovementSection = false;
      }
    }

    return points.slice(0, 5); // Return max 5 points
  }

  /**
   * Process voice query for health assistant
   * @param {string} transcript - User's voice transcript
   * @param {Object} context - Context data (runs, stats)
   * @returns {Object} Voice response
   */
  async processVoiceQuery(transcript, context = {}) {
    const prompt = this.buildVoiceAssistantPrompt(transcript, context);
    
    const response = await this.generateResponse(prompt, 'voice_assistant', {
      queryLength: transcript.length,
      hasRunContext: !!context.recentRuns,
      hasStatsContext: !!context.stats,
    });

    return {
      response: response.text,
      ssmlResponse: this.convertToSSML(response.text),
      traceId: response.traceId,
      generationTime: response.duration,
    };
  }

  /**
   * Build prompt for voice assistant
   */
  buildVoiceAssistantPrompt(transcript, context) {
    let contextSection = '';

    if (context.recentRuns && context.recentRuns.length > 0) {
      const runsInfo = context.recentRuns.slice(0, 5).map(run => {
        const distKm = (run.distance / 1000).toFixed(2);
        const durMin = (run.duration / 60).toFixed(1);
        const date = new Date(run.startTime).toLocaleDateString();
        return `- ${date}: ${distKm} km in ${durMin} min`;
      }).join('\n');
      
      contextSection += `\n### Recent Runs:\n${runsInfo}\n`;
    }

    if (context.stats) {
      contextSection += `
### User Statistics:
- Total Distance: ${((context.stats.totalDistance || 0) / 1000).toFixed(1)} km
- Total Runs: ${context.stats.totalRuns || 0}
- Average Speed: ${((context.stats.averageSpeed || 0) * 3.6).toFixed(1)} km/h
`;
    }

    if (context.currentRun) {
      const run = context.currentRun;
      contextSection += `
### Current Run Being Analyzed:
- Distance: ${(run.distance / 1000).toFixed(2)} km
- Duration: ${(run.duration / 60).toFixed(1)} minutes
- Average Speed: ${(run.averageSpeed * 3.6).toFixed(1)} km/h
`;
    }

    return `
You are a friendly and knowledgeable AI health and fitness assistant named "OneKot Health Assistant". 
You help runners understand their performance, provide health advice, and motivate them.

IMPORTANT INSTRUCTIONS:
1. Keep responses concise and conversational (suitable for voice)
2. Be encouraging and supportive
3. Use simple language, avoid jargon
4. Responses should be 2-4 sentences for simple queries, up to 6 sentences for detailed questions
5. Always be helpful and provide actionable advice when relevant

${contextSection}

USER QUERY: "${transcript}"

Respond naturally as a voice assistant would. If the query is about health or running, use the provided context.
If you don't have enough information, politely ask for clarification or provide general advice.
`;
  }

  /**
   * Convert text to SSML for better TTS output
   */
  convertToSSML(text) {
    // Basic SSML conversion
    let ssml = `<speak>`;
    
    // Add pauses after sentences
    ssml += text
      .replace(/\. /g, '.<break time="300ms"/> ')
      .replace(/! /g, '!<break time="300ms"/> ')
      .replace(/\? /g, '?<break time="300ms"/> ')
      .replace(/: /g, ':<break time="200ms"/> ')
      .replace(/\n\n/g, '<break time="500ms"/>')
      .replace(/\n/g, '<break time="300ms"/>');

    // Emphasize numbers and metrics
    ssml = ssml.replace(/(\d+\.?\d*)\s*(km|minutes?|hours?|calories|kcal)/gi, 
      '<emphasis level="moderate">$1 $2</emphasis>');

    ssml += `</speak>`;
    return ssml;
  }

  /**
   * Get health tips based on user's activity level
   * @param {Object} stats - User statistics
   * @returns {Object} Health tips
   */
  async getHealthTips(stats) {
    const activityLevel = this.determineActivityLevel(stats);
    
    const prompt = `
You are a health and fitness expert. Based on the user's activity level, provide personalized health tips.

Activity Level: ${activityLevel}
Total Distance This Week: ${((stats.weeklyDistance || 0) / 1000).toFixed(1)} km
Total Runs This Week: ${stats.weeklyRuns || 0}
Average Speed: ${((stats.averageSpeed || 0) * 3.6).toFixed(1)} km/h

Provide 5 brief, actionable health tips personalized to their activity level.
Format as a numbered list, each tip should be 1-2 sentences.
`;

    const response = await this.generateResponse(prompt, 'health_tips', {
      activityLevel,
      weeklyDistance: stats.weeklyDistance,
    });

    return {
      tips: response.text,
      activityLevel,
      traceId: response.traceId,
    };
  }

  /**
   * Determine user's activity level
   */
  determineActivityLevel(stats) {
    const weeklyDistanceKm = (stats.weeklyDistance || 0) / 1000;
    const weeklyRuns = stats.weeklyRuns || 0;

    if (weeklyDistanceKm >= 50 && weeklyRuns >= 5) return 'Elite';
    if (weeklyDistanceKm >= 30 && weeklyRuns >= 4) return 'Advanced';
    if (weeklyDistanceKm >= 15 && weeklyRuns >= 3) return 'Intermediate';
    if (weeklyDistanceKm >= 5 && weeklyRuns >= 2) return 'Beginner';
    return 'Starter';
  }

  /**
   * Submit user feedback for LLM response
   * @param {string} traceId - Trace ID from response
   * @param {number} rating - Rating 1-5
   * @param {string} comment - Optional comment
   */
  async submitFeedback(traceId, rating, comment = '') {
    await opikService.logFeedback(traceId, {
      score: rating / 5, // Normalize to 0-1
      comment,
      metadata: {
        rating,
        feedbackType: 'user_rating',
        timestamp: new Date().toISOString(),
      },
    });

    return { success: true, message: 'Feedback recorded' };
  }
}

// Export singleton instance
const geminiService = new GeminiService();
geminiService.initialize();

module.exports = geminiService;
