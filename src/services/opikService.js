/**
 * Opik by Comet - LLM Evaluation & Observability Service
 * Provides tracing, evaluation, and monitoring for Gemini AI interactions
 */

const { Opik } = require('opik');

class OpikService {
  constructor() {
    this.client = null;
    this.isEnabled = false;
    this.projectName = process.env.OPIK_PROJECT_NAME || 'onekot-health-ai';
  }

  /**
   * Initialize Opik client
   */
  initialize() {
    try {
      if (!process.env.OPIK_API_KEY || process.env.OPIK_API_KEY === 'your-opik-api-key-here') {
        console.warn('⚠️ Opik API key not configured. LLM observability disabled.');
        this.isEnabled = false;
        return;
      }

      this.client = new Opik({
        apiKey: process.env.OPIK_API_KEY,
        projectName: this.projectName,
      });

      this.isEnabled = true;
      console.log('✅ Opik LLM Observability initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Opik:', error.message);
      this.isEnabled = false;
    }
  }

  /**
   * Create a new trace for LLM interaction
   * @param {string} name - Trace name
   * @param {Object} metadata - Additional metadata
   * @returns {Object|null} Trace object or null if disabled
   */
  async createTrace(name, metadata = {}) {
    if (!this.isEnabled || !this.client) {
      return this.createMockTrace(name, metadata);
    }

    try {
      const trace = await this.client.trace({
        name,
        metadata: {
          ...metadata,
          project: this.projectName,
          timestamp: new Date().toISOString(),
        },
      });
      return trace;
    } catch (error) {
      console.error('Opik trace creation failed:', error.message);
      return this.createMockTrace(name, metadata);
    }
  }

  /**
   * Create a mock trace when Opik is disabled
   */
  createMockTrace(name, metadata) {
    return {
      id: `mock-${Date.now()}`,
      name,
      metadata,
      span: (options) => this.createMockSpan(options),
      end: () => {},
    };
  }

  /**
   * Create a mock span when Opik is disabled
   */
  createMockSpan(options) {
    return {
      id: `mock-span-${Date.now()}`,
      ...options,
      setOutput: () => {},
      setMetadata: () => {},
      end: () => {},
    };
  }

  /**
   * Log LLM generation event
   * @param {Object} trace - Trace object
   * @param {Object} params - Generation parameters
   * @returns {Object} Span object
   */
  async logGeneration(trace, params) {
    const { input, output, model, duration, tokens, type } = params;

    if (!this.isEnabled || !trace || typeof trace.span !== 'function') {
      return this.createMockSpan({ name: type });
    }

    try {
      const span = trace.span({
        name: type || 'llm_generation',
        type: 'llm',
        input: { prompt: input },
        output: { response: output },
        metadata: {
          model: model || 'gemini-1.5-flash',
          duration_ms: duration,
          token_count: tokens,
          generation_type: type,
        },
      });
      return span;
    } catch (error) {
      console.error('Opik span creation failed:', error.message);
      return this.createMockSpan({ name: type });
    }
  }

  /**
   * Log evaluation metrics
   * @param {Object} trace - Trace object
   * @param {Object} metrics - Evaluation metrics
   */
  async logEvaluation(trace, metrics) {
    if (!this.isEnabled || !trace) return;

    try {
      const span = trace.span({
        name: 'evaluation',
        type: 'evaluation',
        metadata: {
          ...metrics,
          evaluated_at: new Date().toISOString(),
        },
      });
      span.end();
    } catch (error) {
      console.error('Opik evaluation logging failed:', error.message);
    }
  }

  /**
   * Log user feedback for LLM response
   * @param {string} traceId - Trace ID
   * @param {Object} feedback - User feedback data
   */
  async logFeedback(traceId, feedback) {
    if (!this.isEnabled || !this.client) return;

    try {
      await this.client.logFeedback({
        traceId,
        score: feedback.score,
        comment: feedback.comment,
        metadata: feedback.metadata,
      });
    } catch (error) {
      console.error('Opik feedback logging failed:', error.message);
    }
  }

  /**
   * End trace and flush data
   * @param {Object} trace - Trace object
   */
  async endTrace(trace) {
    if (!trace) return;

    try {
      if (typeof trace.end === 'function') {
        trace.end();
      }
    } catch (error) {
      console.error('Opik trace end failed:', error.message);
    }
  }

  /**
   * Track voice interaction metrics
   * @param {Object} trace - Trace object
   * @param {Object} voiceMetrics - Voice interaction metrics
   */
  async logVoiceInteraction(trace, voiceMetrics) {
    if (!this.isEnabled || !trace) return;

    try {
      const span = trace.span({
        name: 'voice_interaction',
        type: 'custom',
        metadata: {
          stt_duration_ms: voiceMetrics.sttDuration,
          tts_duration_ms: voiceMetrics.ttsDuration,
          llm_duration_ms: voiceMetrics.llmDuration,
          total_duration_ms: voiceMetrics.totalDuration,
          audio_length_seconds: voiceMetrics.audioLength,
          transcript_length: voiceMetrics.transcriptLength,
          response_length: voiceMetrics.responseLength,
        },
      });
      span.end();
    } catch (error) {
      console.error('Opik voice interaction logging failed:', error.message);
    }
  }

  /**
   * Get analytics summary
   * @returns {Object} Analytics data
   */
  getAnalyticsSummary() {
    return {
      enabled: this.isEnabled,
      projectName: this.projectName,
      status: this.isEnabled ? 'active' : 'disabled',
    };
  }
}

// Export singleton instance
const opikService = new OpikService();
opikService.initialize();

module.exports = opikService;
