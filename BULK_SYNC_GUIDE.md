# Bulk Sync & Username Guide

## Overview

This guide covers the bulk sync functionality for offline data synchronization and the username field in the User collection.

---

## 📋 Table of Contents

- [Username Field](#username-field)
- [Bulk Sync Endpoint](#bulk-sync-endpoint)
- [Request Format](#request-format)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)

---

## 👤 Username Field

### Description

The `username` field has been added to the User collection to allow users to have a display name.

### Schema Details

```javascript
{
  email: String,        // Required, unique
  username: String,     // Optional, 2-50 characters
  profilePicture: String,
  isActive: Boolean,
  lastLoginAt: Date,
  metadata: {
    totalRuns: Number,
    totalDistance: Number,
    totalDuration: Number
  }
}
```

### Setting Username

Username can be set during login or profile update:

#### During Login

```bash
POST /api/v1/auth/login
Content-Type: application/json
```

**Payload:**
```json
{
  "email": "user@example.com",
  "username": "RunnerJohn",
  "deviceInfo": {
    "deviceName": "iPhone 14",
    "deviceModel": "iPhone14,1",
    "osName": "iOS",
    "osVersion": "17.0",
    "appVersion": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65f1234567890abcdef12345",
      "email": "user@example.com",
      "username": "RunnerJohn",
      "isActive": true,
      "metadata": {
        "totalRuns": 0,
        "totalDistance": 0,
        "totalDuration": 0
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

#### During Profile Update

```bash
PATCH /api/v1/users/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**Payload:**
```json
{
  "username": "NewUsername"
}
```

---

## 🔄 Bulk Sync Endpoint

### Description

The bulk sync endpoint allows syncing multiple runs at once, perfect for uploading offline data when the app reconnects to the internet.

### Endpoint

```
POST /api/v1/runs/bulk-sync
```

### Authentication

Required. Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Rate Limiting

No specific rate limit (uses general API rate limit of 100 requests per 15 minutes)

### Limits

- **Minimum runs per request:** 1
- **Maximum runs per request:** 100

---

## 📤 Request Format

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body Schema

```json
{
  "runs": [
    {
      "id": "string (optional, auto-generated if not provided)",
      "startTime": "ISO 8601 datetime",
      "endTime": "ISO 8601 datetime",
      "distance": "number (meters, must be >= 0)",
      "duration": "number (seconds, must be >= 0)",
      "averageSpeed": "number (m/s, must be >= 0)",
      "maxSpeed": "number (m/s, optional)",
      "notes": "string (optional, max 500 characters)",
      "route": [
        {
          "latitude": "number (-90 to 90)",
          "longitude": "number (-180 to 180)",
          "timestamp": "ISO 8601 datetime",
          "altitude": "number (optional, meters)",
          "accuracy": "number (optional, meters, >= 0)"
        }
      ]
    }
  ]
}
```

### Example Request

```bash
curl -X POST https://onekot-api.vercel.app/api/v1/runs/bulk-sync \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "runs": [
      {
        "id": "1738195200000_user123",
        "startTime": "2026-01-30T10:00:00.000Z",
        "endTime": "2026-01-30T10:30:00.000Z",
        "distance": 5000,
        "duration": 1800,
        "averageSpeed": 2.78,
        "maxSpeed": 4.5,
        "notes": "Morning jog",
        "route": [
          {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "timestamp": "2026-01-30T10:00:00.000Z",
            "altitude": 10,
            "accuracy": 5
          },
          {
            "latitude": 40.7138,
            "longitude": -74.0070,
            "timestamp": "2026-01-30T10:05:00.000Z",
            "altitude": 12,
            "accuracy": 5
          }
        ]
      },
      {
        "startTime": "2026-01-30T14:00:00.000Z",
        "endTime": "2026-01-30T14:45:00.000Z",
        "distance": 7500,
        "duration": 2700,
        "averageSpeed": 2.78,
        "notes": "Afternoon run",
        "route": [
          {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "timestamp": "2026-01-30T14:00:00.000Z"
          },
          {
            "latitude": 40.7148,
            "longitude": -74.0080,
            "timestamp": "2026-01-30T14:10:00.000Z"
          }
        ]
      }
    ]
  }'
```

---

## 📥 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bulk sync completed: 2 created, 0 skipped, 0 errors",
  "data": {
    "successful": [
      {
        "_id": "65f1234567890abcdef12345",
        "id": "1738195200000_user123",
        "userId": "65f1234567890abcdef00001",
        "startTime": "2026-01-30T10:00:00.000Z",
        "endTime": "2026-01-30T10:30:00.000Z",
        "distance": 5000,
        "duration": 1800,
        "averageSpeed": 2.78,
        "maxSpeed": 4.5,
        "notes": "Morning jog",
        "route": [...],
        "isDeleted": false,
        "createdAt": "2026-01-30T12:00:00.000Z",
        "updatedAt": "2026-01-30T12:00:00.000Z"
      },
      {
        "_id": "65f1234567890abcdef12346",
        "id": "1738209600000_user123",
        "userId": "65f1234567890abcdef00001",
        "startTime": "2026-01-30T14:00:00.000Z",
        "endTime": "2026-01-30T14:45:00.000Z",
        "distance": 7500,
        "duration": 2700,
        "averageSpeed": 2.78,
        "maxSpeed": 3.2,
        "notes": "Afternoon run",
        "route": [...],
        "isDeleted": false,
        "createdAt": "2026-01-30T12:00:01.000Z",
        "updatedAt": "2026-01-30T12:00:01.000Z"
      }
    ],
    "failed": [],
    "summary": {
      "total": 2,
      "created": 2,
      "skipped": 0,
      "errors": 0
    }
  },
  "timestamp": "2026-01-30T12:00:01.000Z"
}
```

### Partial Success Response (200 OK)

When some runs succeed and others fail:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bulk sync completed: 1 created, 1 skipped, 1 errors",
  "data": {
    "successful": [
      {
        "_id": "65f1234567890abcdef12345",
        "id": "1738195200000_user123",
        "startTime": "2026-01-30T10:00:00.000Z",
        "endTime": "2026-01-30T10:30:00.000Z",
        "distance": 5000,
        "duration": 1800,
        "averageSpeed": 2.78
      }
    ],
    "failed": [
      {
        "id": "1738195200000_duplicate",
        "reason": "Run already exists",
        "data": {
          "id": "1738195200000_duplicate",
          "startTime": "2026-01-30T09:00:00.000Z",
          "endTime": "2026-01-30T09:30:00.000Z",
          "distance": 3000,
          "duration": 1200,
          "averageSpeed": 2.5,
          "route": [...]
        }
      },
      {
        "id": "unknown",
        "reason": "Validation failed: distance: Path `distance` is required.",
        "data": {
          "startTime": "2026-01-30T11:00:00.000Z",
          "endTime": "2026-01-30T11:30:00.000Z",
          "route": [...]
        }
      }
    ],
    "summary": {
      "total": 3,
      "created": 1,
      "skipped": 1,
      "errors": 1
    }
  },
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

---

## ⚠️ Error Handling

### Validation Errors (400 Bad Request)

When the request payload is invalid:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "runs: Runs must be an array with 1-100 items",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

**Common validation errors:**

- `runs: Runs must be an array with 1-100 items`
- `runs.0.startTime: Start time must be a valid ISO 8601 date`
- `runs.0.distance: Distance must be a positive number (meters)`
- `runs.0.route: Route must have at least 2 location points`
- `runs.0.route.0.latitude: Latitude must be between -90 and 90`

### Authentication Errors (401 Unauthorized)

When token is missing or invalid:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication token is required",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

### Rate Limit Errors (429 Too Many Requests)

When API rate limit is exceeded:

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests, please try again later",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

### Server Errors (500 Internal Server Error)

When an unexpected error occurs:

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

## 🎯 Best Practices

### 1. **Batch Size**
- Keep batch size between 10-50 runs for optimal performance
- If you have more than 100 runs, split them into multiple requests

### 2. **Error Handling**
- Always check the `summary` field to see overall results
- Process `failed` array to retry or log failed runs
- Store failed runs locally and retry later

### 3. **Offline Storage**
- Generate unique IDs for runs before storing offline
- Use timestamp + user identifier format: `{timestamp}_{userId}`
- Mark synced runs to avoid duplicate uploads

### 4. **Network Conditions**
- Only sync when connected to WiFi (to save mobile data)
- Implement exponential backoff for failed requests
- Show sync progress to user

### 5. **Data Validation**
- Validate data locally before sending to reduce errors
- Ensure all required fields are present
- Check that route has at least 2 points

---

## 📊 Response Summary Fields

| Field | Type | Description |
|-------|------|-------------|
| `total` | Number | Total number of runs in the request |
| `created` | Number | Number of runs successfully created |
| `skipped` | Number | Number of runs skipped (already exist) |
| `errors` | Number | Number of runs that failed due to errors |

---

## 🔍 Troubleshooting

### Problem: All runs are being skipped

**Cause:** Runs with the same IDs already exist in the database

**Solution:** 
- Generate new unique IDs for runs
- Check local storage for already synced runs
- Clear sync status and regenerate IDs if needed

### Problem: Validation errors for route points

**Cause:** Invalid GPS coordinates or missing required fields

**Solution:**
- Ensure latitude is between -90 and 90
- Ensure longitude is between -180 and 180
- Verify timestamps are valid ISO 8601 format
- Ensure route has at least 2 points

### Problem: 401 Unauthorized error

**Cause:** Token is expired or invalid

**Solution:**
- Refresh the JWT token by logging in again
- Check token expiration (tokens expire after 7 days)
- Ensure token is included in Authorization header

---

## 📞 Support

For additional help or to report issues:
- GitHub Issues: https://github.com/OneKotApp/OnekotAPI/issues
- API Documentation: https://onekot-api.vercel.app/api/v1

---

## 📝 Notes

- All timestamps should be in ISO 8601 format with UTC timezone
- Distance is always in meters
- Duration is always in seconds
- Speed is always in meters per second (m/s)
- The bulk sync endpoint automatically updates user metadata (total runs, distance, duration)
- Duplicate run IDs are automatically skipped to prevent data corruption
