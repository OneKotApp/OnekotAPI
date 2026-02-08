/**
 * Voice Agent Service
 * Provides Text-to-Speech and Speech-to-Text capabilities using AssemblyAI and Cartesia
 */

const opikService = require('./opikService');

class VoiceAgentService {
  constructor() {
    this.assemblyAIKey = process.env.ASSEMBLYAI_API_KEY;
    this.cartesiaKey = process.env.CARTESIA_API_KEY;
    this.isInitialized = false;
  }

  /**
   * Initialize voice agent
   */
  initialize() {
    try {
      if (!this.assemblyAIKey) {
        console.warn('⚠️ AssemblyAI API key not configured. STT disabled.');
      }
      if (!this.cartesiaKey) {
        console.warn('⚠️ Cartesia API key not configured. TTS disabled.');
      }

      this.isInitialized = true;
      console.log('✅ Voice Agent Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Voice Agent:', error.message);
    }
  }

  /**
   * Convert speech to text using AssemblyAI
   * @param {Buffer|string} audioData - Audio data (base64 or URL)
   * @param {Object} options - Transcription options
   * @returns {Object} Transcription result
   */
  async speechToText(audioData, options = {}) {
    const startTime = Date.now();
    const trace = await opikService.createTrace('voice_stt', {
      provider: 'assemblyai',
      ...options,
    });

    try {
      if (!this.assemblyAIKey) {
        throw new Error('AssemblyAI API key not configured');
      }

      // Upload audio if it's base64
      let audioUrl = audioData;
      if (!audioData.startsWith('http')) {
        audioUrl = await this.uploadAudioToAssemblyAI(audioData);
      }

      // Create transcription request
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': this.assemblyAIKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: options.language || 'en',
          punctuate: true,
          format_text: true,
        }),
      });

      const transcriptData = await transcriptResponse.json();

      if (transcriptData.error) {
        throw new Error(transcriptData.error);
      }

      // Poll for completion
      const transcript = await this.pollTranscription(transcriptData.id);
      const duration = Date.now() - startTime;

      // Log to Opik
      await opikService.logVoiceInteraction(trace, {
        sttDuration: duration,
        transcriptLength: transcript.text?.length || 0,
        audioLength: options.audioDuration || 0,
      });

      await opikService.endTrace(trace);

      return {
        text: transcript.text,
        confidence: transcript.confidence,
        words: transcript.words,
        duration,
        success: true,
      };
    } catch (error) {
      await opikService.endTrace(trace);
      throw error;
    }
  }

  /**
   * Upload audio to AssemblyAI
   */
  async uploadAudioToAssemblyAI(base64Audio) {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': this.assemblyAIKey,
        'Content-Type': 'application/octet-stream',
      },
      body: audioBuffer,
    });

    const uploadData = await uploadResponse.json();
    return uploadData.upload_url;
  }

  /**
   * Poll AssemblyAI for transcription completion
   */
  async pollTranscription(transcriptId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': this.assemblyAIKey,
        },
      });

      const data = await response.json();

      if (data.status === 'completed') {
        return data;
      } else if (data.status === 'error') {
        throw new Error(data.error || 'Transcription failed');
      }

      // Wait 1 second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Transcription timeout');
  }

  /**
   * Convert text to speech using Cartesia
   * @param {string} text - Text to convert
   * @param {Object} options - TTS options
   * @returns {Object} Audio result
   */
  async textToSpeech(text, options = {}) {
    const startTime = Date.now();
    const trace = await opikService.createTrace('voice_tts', {
      provider: 'cartesia',
      textLength: text.length,
      ...options,
    });

    try {
      if (!this.cartesiaKey) {
        throw new Error('Cartesia API key not configured');
      }

      // Cartesia TTS API call
      const response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'X-API-Key': this.cartesiaKey,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: options.modelId || 'sonic-english',
          transcript: text,
          voice: {
            mode: 'id',
            id: options.voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091', // Default friendly voice
          },
          output_format: {
            container: 'mp3',
            encoding: 'mp3',
            sample_rate: 44100,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Cartesia TTS failed: ${errorData}`);
      }

      // Get audio as buffer
      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const duration = Date.now() - startTime;

      // Log to Opik
      await opikService.logVoiceInteraction(trace, {
        ttsDuration: duration,
        responseLength: text.length,
        audioSize: audioBuffer.byteLength,
      });

      await opikService.endTrace(trace);

      return {
        audio: base64Audio,
        format: 'mp3',
        sampleRate: 44100,
        duration,
        textLength: text.length,
        success: true,
      };
    } catch (error) {
      await opikService.endTrace(trace);
      
      // Return a fallback response
      return {
        audio: null,
        error: error.message,
        text: text, // Return text for client-side TTS fallback
        success: false,
      };
    }
  }

  /**
   * Process voice interaction (STT -> AI -> TTS)
   * @param {Buffer|string} audioData - Input audio
   * @param {Function} processCallback - AI processing callback
   * @param {Object} context - Context for AI
   * @returns {Object} Complete voice interaction result
   */
  async processVoiceInteraction(audioData, processCallback, context = {}) {
    const startTime = Date.now();
    const trace = await opikService.createTrace('voice_interaction_complete', {
      hasContext: Object.keys(context).length > 0,
    });

    const result = {
      transcript: null,
      aiResponse: null,
      audioResponse: null,
      metrics: {
        sttTime: 0,
        aiTime: 0,
        ttsTime: 0,
        totalTime: 0,
      },
      success: false,
    };

    try {
      // Step 1: Speech to Text
      const sttStart = Date.now();
      const sttResult = await this.speechToText(audioData);
      result.transcript = sttResult.text;
      result.metrics.sttTime = Date.now() - sttStart;

      // Step 2: AI Processing
      const aiStart = Date.now();
      const aiResult = await processCallback(sttResult.text, context);
      result.aiResponse = aiResult;
      result.metrics.aiTime = Date.now() - aiStart;

      // Step 3: Text to Speech
      const ttsStart = Date.now();
      const responseText = typeof aiResult === 'string' ? aiResult : aiResult.response || aiResult.text;
      const ttsResult = await this.textToSpeech(responseText);
      result.audioResponse = ttsResult;
      result.metrics.ttsTime = Date.now() - ttsStart;

      result.metrics.totalTime = Date.now() - startTime;
      result.success = true;

      // Log complete interaction
      await opikService.logVoiceInteraction(trace, {
        sttDuration: result.metrics.sttTime,
        llmDuration: result.metrics.aiTime,
        ttsDuration: result.metrics.ttsTime,
        totalDuration: result.metrics.totalTime,
        transcriptLength: result.transcript?.length || 0,
        responseLength: responseText?.length || 0,
      });

      await opikService.endTrace(trace);

      return result;
    } catch (error) {
      result.error = error.message;
      result.metrics.totalTime = Date.now() - startTime;
      
      await opikService.endTrace(trace);
      
      return result;
    }
  }

  /**
   * Stream TTS response (for real-time playback)
   * @param {string} text - Text to convert
   * @param {Object} options - TTS options
   * @returns {ReadableStream} Audio stream
   */
  async streamTextToSpeech(text, options = {}) {
    if (!this.cartesiaKey) {
      throw new Error('Cartesia API key not configured');
    }

    const response = await fetch('https://api.cartesia.ai/tts/stream', {
      method: 'POST',
      headers: {
        'X-API-Key': this.cartesiaKey,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: options.modelId || 'sonic-english',
        transcript: text,
        voice: {
          mode: 'id',
          id: options.voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091',
        },
        output_format: {
          container: 'raw',
          encoding: 'pcm_f32le',
          sample_rate: 24000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Cartesia streaming TTS failed: ${response.statusText}`);
    }

    return response.body;
  }

  /**
   * Get available voices for TTS
   * @returns {Array} List of available voices
   */
  getAvailableVoices() {
    return [
      { id: 'a0e99841-438c-4a64-b679-ae501e7d6091', name: 'Friendly Assistant', gender: 'female' },
      { id: '79a125e8-cd45-4c13-8a67-188112f4dd22', name: 'Professional Coach', gender: 'male' },
      { id: '694f9389-aac1-45b6-b726-9d9369183238', name: 'Energetic Trainer', gender: 'female' },
    ];
  }

  /**
   * Validate audio format
   * @param {string} base64Audio - Base64 encoded audio
   * @returns {Object} Validation result
   */
  validateAudioFormat(base64Audio) {
    try {
      const buffer = Buffer.from(base64Audio, 'base64');
      
      // Check for common audio signatures
      const wav = buffer.slice(0, 4).toString() === 'RIFF';
      const mp3 = buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0;
      const ogg = buffer.slice(0, 4).toString() === 'OggS';
      const webm = buffer.slice(0, 4).toString('hex') === '1a45dfa3';

      return {
        valid: wav || mp3 || ogg || webm,
        format: wav ? 'wav' : mp3 ? 'mp3' : ogg ? 'ogg' : webm ? 'webm' : 'unknown',
        size: buffer.length,
      };
    } catch (error) {
      return {
        valid: false,
        format: 'invalid',
        error: error.message,
      };
    }
  }
}

// Export singleton instance
const voiceAgentService = new VoiceAgentService();
voiceAgentService.initialize();

module.exports = voiceAgentService;
