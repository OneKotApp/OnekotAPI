# AI Health & Voice Assistant API Documentation

This document describes the AI-powered features for run analysis, health insights, weekly reports, and voice interactions in the OneKot API.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Run Analysis Endpoints](#run-analysis-endpoints)
4. [Weekly Reports](#weekly-reports)
5. [Voice Assistant](#voice-assistant)
6. [LLM Observability (Opik)](#llm-observability-opik)
7. [Flutter Integration Examples](#flutter-integration-examples)

---

## Overview

The AI Health module provides intelligent analysis of running data using Google's Gemini AI, with full observability through Opik by Comet. Features include:

- **Run Analysis**: Get detailed AI-powered insights for individual runs
- **Health Benefits**: Understand the health benefits gained from each run
- **Weekly Reports**: Comprehensive weekly health and fitness reports
- **Voice Assistant**: Google Assistant-like voice interaction for health queries
- **LLM Evaluation**: Track and improve AI response quality with Opik

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Google Gemini API Key (required)
GOOGLE_API_KEY=your-google-api-key

# AssemblyAI API Key (for Speech-to-Text)
ASSEMBLYAI_API_KEY=your-assemblyai-api-key

# Cartesia TTS API Key (for Text-to-Speech)
CARTESIA_API_KEY=your-cartesia-api-key

# Opik by Comet (LLM Evaluation & Observability)
OPIK_API_KEY=your-opik-api-key
OPIK_PROJECT_NAME=onekot-health-ai
```

---

## Run Analysis Endpoints

### Analyze a Saved Run

Analyze a specific run from the database with AI-powered insights.

**Endpoint:** `POST /api/v1/ai/analyze-run/:runId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Run analysis completed",
  "data": {
    "runId": "run_abc123",
    "analysis": "## Run Performance Analysis\n\nGreat run today! ...",
    "runStats": {
      "distanceKm": 5.23,
      "durationMinutes": 32.5,
      "paceMinPerKm": 6.21,
      "avgSpeedKmh": 9.66,
      "maxSpeedKmh": 12.4,
      "estimatedCalories": 314
    },
    "healthBenefits": [
      "Cardiovascular",
      "Calories",
      "Mental health",
      "Endurance"
    ],
    "traceId": "trace_xyz789",
    "generationTime": "1523ms"
  }
}
```

### Analyze Run Data (Without Saving)

Analyze run data directly without requiring a saved run.

**Endpoint:** `POST /api/v1/ai/analyze-run`

**Request Body:**
```json
{
  "distance": 5230,
  "duration": 1950,
  "averageSpeed": 2.68,
  "maxSpeed": 3.44,
  "startTime": "2026-02-08T07:00:00Z",
  "endTime": "2026-02-08T07:32:30Z",
  "notes": "Morning run in the park",
  "route": [
    {
      "latitude": 18.5204,
      "longitude": 73.8567,
      "timestamp": "2026-02-08T07:00:00Z"
    }
  ]
}
```

---

## Weekly Reports

### Get Weekly Health Report

Generate a comprehensive AI-powered weekly health and fitness report.

**Endpoint:** `GET /api/v1/ai/weekly-report`

**Query Parameters:**
- `startDate` (optional): ISO8601 date for week start
- `endDate` (optional): ISO8601 date for week end

**Response:**
```json
{
  "success": true,
  "message": "Weekly health report generated",
  "data": {
    "weekRange": "02/01/2026 - 02/08/2026",
    "report": "## Weekly Performance Summary\n\n...",
    "weeklyStats": {
      "totalRuns": 5,
      "totalDistance": 28.5,
      "totalDuration": 185.3,
      "avgDistance": 5.7,
      "avgPace": 6.5,
      "avgSpeed": 9.23,
      "longestRun": 8.2,
      "fastestSpeed": 11.5,
      "totalCalories": 1710,
      "runDays": 5
    },
    "healthAnalysis": {
      "performanceSummary": "",
      "healthBenefits": ["Cardiovascular", "Weight", "Mental health"],
      "weeklyScore": 85
    },
    "improvementPoints": [
      "Increase your long run distance by 10%",
      "Add interval training once a week",
      "Focus on post-run stretching"
    ],
    "traceId": "trace_abc123",
    "generationTime": "2145ms"
  }
}
```

### Get Health Tips

Get personalized health tips based on activity level.

**Endpoint:** `GET /api/v1/ai/health-tips`

**Response:**
```json
{
  "success": true,
  "message": "Health tips generated",
  "data": {
    "tips": "1. Great consistency this week! ...",
    "activityLevel": "Intermediate",
    "traceId": "trace_def456"
  }
}
```

---

## Voice Assistant

The voice assistant provides a Google Assistant-like experience for health queries.

### Voice Query (Text Input)

Send a text query to the health assistant.

**Endpoint:** `POST /api/v1/ai/voice/query`

**Request Body:**
```json
{
  "transcript": "How did my run today compare to last week?",
  "runId": "run_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Voice query processed",
  "data": {
    "query": "How did my run today compare to last week?",
    "response": "Your run today was fantastic! You covered 5.2 km...",
    "ssmlResponse": "<speak>Your run today was fantastic!...</speak>",
    "traceId": "trace_voice123",
    "generationTime": "892ms"
  }
}
```

### Full Voice Interaction (Audio In → Audio Out)

Complete voice-to-voice interaction pipeline.

**Endpoint:** `POST /api/v1/ai/voice/interact`

**Request Body:**
```json
{
  "audioData": "base64_encoded_audio_data",
  "voiceId": "a0e99841-438c-4a64-b679-ae501e7d6091",
  "runId": "run_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Voice interaction completed",
  "data": {
    "transcript": "What are my health stats this week?",
    "aiResponse": "This week you've run 28.5 kilometers...",
    "audio": "base64_encoded_audio_response",
    "audioFormat": "mp3",
    "metrics": {
      "sttTime": 1234,
      "aiTime": 892,
      "ttsTime": 567,
      "totalTime": 2693
    }
  }
}
```

### Text to Speech

Convert text to audio.

**Endpoint:** `POST /api/v1/ai/voice/tts`

**Request Body:**
```json
{
  "text": "Great job on your run today!",
  "voiceId": "a0e99841-438c-4a64-b679-ae501e7d6091"
}
```

### Speech to Text

Convert audio to text.

**Endpoint:** `POST /api/v1/ai/voice/stt`

**Request Body:**
```json
{
  "audioData": "base64_encoded_audio",
  "language": "en"
}
```

### Get Available Voices

**Endpoint:** `GET /api/v1/ai/voice/voices`

**Response:**
```json
{
  "success": true,
  "data": {
    "voices": [
      { "id": "a0e99841-438c-4a64-b679-ae501e7d6091", "name": "Friendly Assistant", "gender": "female" },
      { "id": "79a125e8-cd45-4c13-8a67-188112f4dd22", "name": "Professional Coach", "gender": "male" },
      { "id": "694f9389-aac1-45b6-b726-9d9369183238", "name": "Energetic Trainer", "gender": "female" }
    ]
  }
}
```

---

## LLM Observability (Opik)

All AI interactions are tracked through Opik for evaluation and improvement.

### Submit Feedback

Help improve AI responses by submitting feedback.

**Endpoint:** `POST /api/v1/ai/feedback`

**Request Body:**
```json
{
  "traceId": "trace_xyz789",
  "rating": 5,
  "comment": "Very helpful analysis!"
}
```

### Get AI Service Status

Check the status of AI services.

**Endpoint:** `GET /api/v1/ai/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "gemini": {
      "initialized": true,
      "model": "gemini-1.5-flash"
    },
    "voice": {
      "stt": true,
      "tts": true
    },
    "opik": {
      "enabled": true,
      "projectName": "onekot-health-ai",
      "status": "active"
    }
  }
}
```

---

## Flutter Integration Examples

### Run Analysis Screen

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class AIHealthService {
  final String baseUrl;
  final String token;

  AIHealthService({required this.baseUrl, required this.token});

  // Analyze a specific run
  Future<Map<String, dynamic>> analyzeRun(String runId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/ai/analyze-run/$runId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    }
    throw Exception('Failed to analyze run');
  }

  // Get weekly report
  Future<Map<String, dynamic>> getWeeklyReport({DateTime? startDate, DateTime? endDate}) async {
    var uri = Uri.parse('$baseUrl/api/v1/ai/weekly-report');
    
    if (startDate != null || endDate != null) {
      uri = uri.replace(queryParameters: {
        if (startDate != null) 'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate.toIso8601String(),
      });
    }

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    }
    throw Exception('Failed to get weekly report');
  }
}
```

### Voice Assistant Widget

```dart
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:audioplayers/audioplayers.dart';
import 'dart:convert';

class VoiceAssistantWidget extends StatefulWidget {
  @override
  _VoiceAssistantWidgetState createState() => _VoiceAssistantWidgetState();
}

class _VoiceAssistantWidgetState extends State<VoiceAssistantWidget> {
  final stt.SpeechToText _speech = stt.SpeechToText();
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isListening = false;
  String _text = '';
  String _response = '';

  Future<void> _processVoiceQuery(String text) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/ai/voice/query'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'transcript': text}),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body)['data'];
      setState(() {
        _response = data['response'];
      });

      // Get TTS audio
      final ttsResponse = await http.post(
        Uri.parse('$baseUrl/api/v1/ai/voice/tts'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({'text': data['response']}),
      );

      if (ttsResponse.statusCode == 200) {
        final audioData = json.decode(ttsResponse.body)['data']['audio'];
        // Play audio
        await _audioPlayer.playBytes(base64.decode(audioData));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Microphone button
        FloatingActionButton(
          onPressed: _isListening ? _stopListening : _startListening,
          child: Icon(_isListening ? Icons.mic_off : Icons.mic),
        ),
        
        // Display transcription
        Text('You said: $_text'),
        
        // Display AI response
        Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Text(_response),
          ),
        ),
      ],
    );
  }

  void _startListening() async {
    bool available = await _speech.initialize();
    if (available) {
      setState(() => _isListening = true);
      _speech.listen(
        onResult: (result) {
          setState(() {
            _text = result.recognizedWords;
          });
          if (result.finalResult) {
            _processVoiceQuery(_text);
          }
        },
      );
    }
  }

  void _stopListening() {
    _speech.stop();
    setState(() => _isListening = false);
  }
}
```

### Weekly Report Screen

```dart
class WeeklyReportScreen extends StatefulWidget {
  @override
  _WeeklyReportScreenState createState() => _WeeklyReportScreenState();
}

class _WeeklyReportScreenState extends State<WeeklyReportScreen> {
  Map<String, dynamic>? _report;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    try {
      final report = await AIHealthService(
        baseUrl: 'https://your-api.com',
        token: userToken,
      ).getWeeklyReport();
      
      setState(() {
        _report = report;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Week Range
          Text(
            'Week of ${_report?['weekRange']}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          
          // Stats Cards
          Row(
            children: [
              _StatCard(
                title: 'Total Distance',
                value: '${_report?['weeklyStats']['totalDistance']} km',
                icon: Icons.straighten,
              ),
              _StatCard(
                title: 'Total Runs',
                value: '${_report?['weeklyStats']['totalRuns']}',
                icon: Icons.directions_run,
              ),
            ],
          ),
          
          // Health Score
          Card(
            child: ListTile(
              leading: CircularProgressIndicator(
                value: (_report?['healthAnalysis']['weeklyScore'] ?? 0) / 100,
              ),
              title: Text('Health Score'),
              subtitle: Text('${_report?['healthAnalysis']['weeklyScore']}/100'),
            ),
          ),
          
          // AI Report (Markdown)
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: MarkdownBody(
                data: _report?['report'] ?? '',
              ),
            ),
          ),
          
          // Improvement Points
          Text('Improvement Points', style: Theme.of(context).textTheme.titleMedium),
          ...(_report?['improvementPoints'] as List? ?? []).map(
            (point) => ListTile(
              leading: Icon(Icons.lightbulb_outline),
              title: Text(point),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional details"
  }
}
```

Common error codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found (run not found)
- `500` - Internal Server Error (AI service error)

---

## Rate Limits

AI endpoints have the following rate limits:
- Run analysis: 30 requests/minute
- Weekly reports: 10 requests/minute
- Voice interactions: 20 requests/minute
- TTS/STT: 50 requests/minute
