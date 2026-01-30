# OneKot API Documentation for Flutter Integration

**Base URL:** `http://localhost:3000` (Development)  
**Production URL:** `https://api.onekot.com` (To be configured)

**API Version:** v1

---

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Request Headers](#request-headers)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#1-authentication)
   - [Runs](#2-runs)
   - [Statistics](#3-statistics)
   - [Users](#4-users)
6. [Data Models](#data-models)
7. [Status Codes](#status-codes)

---

## Authentication Flow

### Overview
The API uses JWT (JSON Web Token) authentication. For MVP, authentication requires only an email address.

### Flow
1. User logs in with email → Receives JWT token
2. Store token securely (use `flutter_secure_storage`)
3. Include token in Authorization header for all protected endpoints
4. Token expires after 7 days (configurable)

---

## Request Headers

### Required Headers for All Requests
```
Content-Type: application/json
```

### Required Headers for Protected Endpoints
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## Response Format

### Success Response Structure
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {
    // Response data object
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

### Success Response with Pagination
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data fetched successfully",
  "data": [
    // Array of items
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalItems": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

### Error Response Structure
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

## Error Handling

### Common Error Status Codes
| Status Code | Meaning | Description |
|------------|---------|-------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Server temporarily unavailable |

### Common Error Messages
```json
{
  "success": false,
  "statusCode": 401,
  "message": "No token provided",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Token expired",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Run session not found",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "message": "email: Email is required",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

## API Endpoints

## 1. Authentication

### 1.1 Login / Register
**Endpoint:** `POST /api/v1/auth/login`  
**Authentication:** Not required  
**Rate Limit:** 10 requests per 15 minutes

**Description:** Login with email or create new account if email doesn't exist.

**Request Body:**
```json
{
  "email": "user@example.com",
  "deviceInfo": {
    "deviceName": "iPhone 14 Pro",
    "deviceModel": "iPhone14,3",
    "osName": "iOS",
    "osVersion": "17.0",
    "appVersion": "1.0.0"
  },
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "city": "Mumbai",
    "country": "India",
    "ipAddress": "192.168.1.1"
  }
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | Yes | Valid email address |
| deviceInfo | Object | No | Device information |
| deviceInfo.deviceName | String | No | Device name |
| deviceInfo.deviceModel | String | No | Device model |
| deviceInfo.osName | String | No | Operating system name |
| deviceInfo.osVersion | String | No | OS version |
| deviceInfo.appVersion | String | No | App version |
| location | Object | No | User location |
| location.latitude | Number | No | GPS latitude (-90 to 90) |
| location.longitude | Number | No | GPS longitude (-180 to 180) |
| location.city | String | No | City name |
| location.country | String | No | Country name |
| location.ipAddress | String | No | IP address |

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65b8f9c5d1e4a2b3c4d5e6f7",
      "email": "user@example.com",
      "username": null,
      "profilePicture": null,
      "isActive": true,
      "lastLoginAt": "2026-01-30T10:00:00.000Z",
      "metadata": {
        "totalRuns": 0,
        "totalDistance": 0,
        "totalDuration": 0
      },
      "createdAt": "2026-01-30T10:00:00.000Z",
      "updatedAt": "2026-01-30T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Error Responses:**

*Email Required (400):*
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Email is required",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

*Invalid Email (400):*
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Please provide a valid email address",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

*Rate Limit Exceeded (429):*
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many login attempts, please try again later",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Flutter Implementation Example:**
```dart
Future<Map<String, dynamic>> login(String email) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/v1/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'deviceInfo': {
        'deviceName': await getDeviceName(),
        'osName': Platform.isIOS ? 'iOS' : 'Android',
        'osVersion': await getOSVersion(),
        'appVersion': await getAppVersion(),
      },
      'location': await getCurrentLocation(),
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Store token securely
    await secureStorage.write(key: 'auth_token', value: data['data']['token']);
    return data;
  } else {
    throw Exception('Login failed');
  }
}
```

---

### 1.2 Get Current User
**Endpoint:** `GET /api/v1/auth/me`  
**Authentication:** Required  

**Description:** Get authenticated user profile.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User fetched successfully",
  "data": {
    "user": {
      "_id": "65b8f9c5d1e4a2b3c4d5e6f7",
      "email": "user@example.com",
      "username": "John Runner",
      "profilePicture": "https://example.com/avatar.jpg",
      "isActive": true,
      "lastLoginAt": "2026-01-30T10:00:00.000Z",
      "metadata": {
        "totalRuns": 15,
        "totalDistance": 75000,
        "totalDuration": 25200
      },
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-30T10:00:00.000Z"
    }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Error Responses:**

*No Token (401):*
```json
{
  "success": false,
  "statusCode": 401,
  "message": "No token provided",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

*Invalid Token (401):*
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid token",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

*Token Expired (401):*
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Token expired",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Flutter Implementation:**
```dart
Future<Map<String, dynamic>> getCurrentUser() async {
  final token = await secureStorage.read(key: 'auth_token');
  
  final response = await http.get(
    Uri.parse('$baseUrl/api/v1/auth/me'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else if (response.statusCode == 401) {
    // Token expired, redirect to login
    await logout();
    throw Exception('Session expired');
  } else {
    throw Exception('Failed to fetch user');
  }
}
```

---

### 1.3 Get Login History
**Endpoint:** `GET /api/v1/auth/login-history`  
**Authentication:** Required  

**Description:** Get user's login history with device and location info.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | Integer | No | 1 | Page number |
| limit | Integer | No | 20 | Items per page (max 100) |

**Request Example:**
```
GET /api/v1/auth/login-history?page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login history fetched successfully",
  "data": {
    "activities": [
      {
        "_id": "65b8f9c5d1e4a2b3c4d5e6f8",
        "userId": "65b8f9c5d1e4a2b3c4d5e6f7",
        "email": "user@example.com",
        "loginTime": "2026-01-30T10:00:00.000Z",
        "deviceInfo": {
          "deviceName": "iPhone 14 Pro",
          "deviceModel": "iPhone14,3",
          "osName": "iOS",
          "osVersion": "17.0",
          "appVersion": "1.0.0"
        },
        "location": {
          "latitude": 19.0760,
          "longitude": 72.8777,
          "city": "Mumbai",
          "country": "India",
          "ipAddress": "192.168.1.1"
        },
        "status": "success",
        "createdAt": "2026-01-30T10:00:00.000Z"
      }
    ],
    "totalItems": 25
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

## 2. Runs

### 2.1 Create Run
**Endpoint:** `POST /api/v1/runs`  
**Authentication:** Required  
**Rate Limit:** 10 runs per minute

**Description:** Create a new run session with route data.

**Request Body:**
```json
{
  "id": "1706604000000_abc123xyz",
  "startTime": "2026-01-30T06:00:00.000Z",
  "endTime": "2026-01-30T06:30:00.000Z",
  "distance": 5000,
  "duration": 1800,
  "averageSpeed": 10.0,
  "maxSpeed": 15.5,
  "notes": "Morning run in the park",
  "route": [
    {
      "latitude": 19.0760,
      "longitude": 72.8777,
      "timestamp": "2026-01-30T06:00:00.000Z",
      "altitude": 10.5,
      "accuracy": 5.0
    },
    {
      "latitude": 19.0765,
      "longitude": 72.8780,
      "timestamp": "2026-01-30T06:05:00.000Z",
      "altitude": 11.0,
      "accuracy": 4.8
    },
    {
      "latitude": 19.0770,
      "longitude": 72.8785,
      "timestamp": "2026-01-30T06:10:00.000Z",
      "altitude": 12.0,
      "accuracy": 5.2
    }
  ]
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String | No | Unique ID (auto-generated if not provided) |
| startTime | String (ISO 8601) | Yes | Run start time |
| endTime | String (ISO 8601) | Yes | Run end time |
| distance | Number | Yes | Total distance in meters |
| duration | Number | Yes | Total duration in seconds |
| averageSpeed | Number | Yes | Average speed in km/h |
| maxSpeed | Number | No | Maximum speed in km/h |
| notes | String | No | Run notes (max 500 chars) |
| route | Array | Yes | Array of location points (min 1 point) |
| route[].latitude | Number | Yes | Latitude (-90 to 90) |
| route[].longitude | Number | Yes | Longitude (-180 to 180) |
| route[].timestamp | String (ISO 8601) | Yes | Point timestamp |
| route[].altitude | Number | No | Altitude in meters |
| route[].accuracy | Number | No | GPS accuracy in meters |

**Success Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Run session created successfully",
  "data": {
    "run": {
      "_id": "65b8f9c5d1e4a2b3c4d5e6f9",
      "id": "1706604000000_abc123xyz",
      "userId": "65b8f9c5d1e4a2b3c4d5e6f7",
      "startTime": "2026-01-30T06:00:00.000Z",
      "endTime": "2026-01-30T06:30:00.000Z",
      "distance": 5000,
      "duration": 1800,
      "averageSpeed": 10.0,
      "maxSpeed": 15.5,
      "notes": "Morning run in the park",
      "route": [
        {
          "latitude": 19.0760,
          "longitude": 72.8777,
          "timestamp": "2026-01-30T06:00:00.000Z",
          "altitude": 10.5,
          "accuracy": 5.0
        }
      ],
      "isDeleted": false,
      "createdAt": "2026-01-30T10:00:00.000Z",
      "updatedAt": "2026-01-30T10:00:00.000Z"
    }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Error Responses:**

*Validation Error (400):*
```json
{
  "success": false,
  "statusCode": 400,
  "message": "distance: Distance is required, route: Route must contain at least one location point",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

*Duplicate Run (409):*
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Run with this ID already exists",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

*Rate Limit (429):*
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many run submissions, please slow down",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Flutter Implementation:**
```dart
Future<Map<String, dynamic>> createRun({
  required DateTime startTime,
  required DateTime endTime,
  required double distance,
  required int duration,
  required double averageSpeed,
  double? maxSpeed,
  String? notes,
  required List<LocationPoint> route,
}) async {
  final token = await secureStorage.read(key: 'auth_token');
  
  final response = await http.post(
    Uri.parse('$baseUrl/api/v1/runs'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'distance': distance,
      'duration': duration,
      'averageSpeed': averageSpeed,
      'maxSpeed': maxSpeed,
      'notes': notes,
      'route': route.map((point) => point.toJson()).toList(),
    }),
  );
  
  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to create run');
  }
}
```

---

### 2.2 Get All Runs (Paginated)
**Endpoint:** `GET /api/v1/runs`  
**Authentication:** Required  

**Description:** Get all runs for authenticated user with pagination.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | Integer | No | 1 | Page number |
| limit | Integer | No | 10 | Items per page (max 100) |
| includeDeleted | Boolean | No | false | Include soft-deleted runs |

**Request Example:**
```
GET /api/v1/runs?page=1&limit=10&includeDeleted=false
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Runs fetched successfully",
  "data": [
    {
      "_id": "65b8f9c5d1e4a2b3c4d5e6f9",
      "id": "1706604000000_abc123xyz",
      "userId": "65b8f9c5d1e4a2b3c4d5e6f7",
      "startTime": "2026-01-30T06:00:00.000Z",
      "endTime": "2026-01-30T06:30:00.000Z",
      "distance": 5000,
      "duration": 1800,
      "averageSpeed": 10.0,
      "maxSpeed": 15.5,
      "notes": "Morning run",
      "route": [],
      "isDeleted": false,
      "createdAt": "2026-01-30T10:00:00.000Z",
      "updatedAt": "2026-01-30T10:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "totalItems": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Flutter Implementation:**
```dart
Future<Map<String, dynamic>> getRuns({int page = 1, int limit = 10}) async {
  final token = await secureStorage.read(key: 'auth_token');
  
  final response = await http.get(
    Uri.parse('$baseUrl/api/v1/runs?page=$page&limit=$limit'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to fetch runs');
  }
}
```

---

### 2.3 Get Run by ID
**Endpoint:** `GET /api/v1/runs/:id`  
**Authentication:** Required  

**Description:** Get a specific run with full route data.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | Run ID |

**Request Example:**
```
GET /api/v1/runs/1706604000000_abc123xyz
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Run fetched successfully",
  "data": {
    "run": {
      "_id": "65b8f9c5d1e4a2b3c4d5e6f9",
      "id": "1706604000000_abc123xyz",
      "userId": "65b8f9c5d1e4a2b3c4d5e6f7",
      "startTime": "2026-01-30T06:00:00.000Z",
      "endTime": "2026-01-30T06:30:00.000Z",
      "distance": 5000,
      "duration": 1800,
      "averageSpeed": 10.0,
      "maxSpeed": 15.5,
      "notes": "Morning run in the park",
      "route": [
        {
          "latitude": 19.0760,
          "longitude": 72.8777,
          "timestamp": "2026-01-30T06:00:00.000Z",
          "altitude": 10.5,
          "accuracy": 5.0,
          "_id": "65b8f9c5d1e4a2b3c4d5e6fa"
        }
      ],
      "isDeleted": false,
      "createdAt": "2026-01-30T10:00:00.000Z",
      "updatedAt": "2026-01-30T10:00:00.000Z"
    }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Error Responses:**

*Run Not Found (404):*
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Run session not found",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

### 2.4 Get Recent Runs
**Endpoint:** `GET /api/v1/runs/recent`  
**Authentication:** Required  

**Description:** Get most recent runs.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | Integer | No | 10 | Number of runs (max 100) |

**Request Example:**
```
GET /api/v1/runs/recent?limit=5
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Runs fetched successfully",
  "data": {
    "runs": [
      {
        "_id": "65b8f9c5d1e4a2b3c4d5e6f9",
        "id": "1706604000000_abc123xyz",
        "startTime": "2026-01-30T06:00:00.000Z",
        "distance": 5000,
        "duration": 1800,
        "averageSpeed": 10.0
      }
    ],
    "count": 5
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

### 2.5 Get Runs by Date Range
**Endpoint:** `GET /api/v1/runs/date-range`  
**Authentication:** Required  

**Description:** Get runs within a specific date range.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | String (ISO 8601) | Yes | Start date |
| endDate | String (ISO 8601) | Yes | End date |

**Request Example:**
```
GET /api/v1/runs/date-range?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Runs fetched successfully",
  "data": {
    "runs": [
      {
        "_id": "65b8f9c5d1e4a2b3c4d5e6f9",
        "id": "1706604000000_abc123xyz",
        "startTime": "2026-01-30T06:00:00.000Z",
        "distance": 5000,
        "duration": 1800,
        "averageSpeed": 10.0
      }
    ],
    "count": 15
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Error Responses:**

*Invalid Date Range (400):*
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid date range",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

### 2.6 Update Run
**Endpoint:** `PATCH /api/v1/runs/:id`  
**Authentication:** Required  

**Description:** Update run notes (only notes can be updated).

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | Run ID |

**Request Body:**
```json
{
  "notes": "Updated run notes - Great morning session!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Run updated successfully",
  "data": {
    "run": {
      "_id": "65b8f9c5d1e4a2b3c4d5e6f9",
      "id": "1706604000000_abc123xyz",
      "notes": "Updated run notes - Great morning session!",
      "updatedAt": "2026-01-30T11:00:00.000Z"
    }
  },
  "timestamp": "2026-01-30T11:00:00.000Z"
}
```

---

### 2.7 Delete Run
**Endpoint:** `DELETE /api/v1/runs/:id`  
**Authentication:** Required  

**Description:** Soft delete a run (can be recovered).

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | Run ID |

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Run deleted successfully",
  "data": null,
  "timestamp": "2026-01-30T11:00:00.000Z"
}
```

**Error Responses:**

*Run Not Found (404):*
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Run session not found",
  "timestamp": "2026-01-30T11:00:00.000Z"
}
```

---

## 3. Statistics

### 3.1 Get Stats Overview
**Endpoint:** `GET /api/v1/stats/overview`  
**Authentication:** Required  

**Description:** Get comprehensive statistics for all periods (daily, weekly, monthly, yearly, all-time).

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Statistics fetched successfully",
  "data": {
    "stats": {
      "allTime": {
        "_id": "65b8f9c5d1e4a2b3c4d5e6fb",
        "userId": "65b8f9c5d1e4a2b3c4d5e6f7",
        "periodType": "all_time",
        "totalDistance": 125000,
        "totalDuration": 45000,
        "totalRuns": 25,
        "averageSpeed": 10.0,
        "longestRun": 10000,
        "longestDuration": 3600,
        "fastestSpeed": 18.5
      },
      "weekly": {
        "totalDistance": 15000,
        "totalDuration": 5400,
        "totalRuns": 3,
        "averageSpeed": 10.0
      },
      "monthly": {
        "totalDistance": 45000,
        "totalDuration": 16200,
        "totalRuns": 9,
        "averageSpeed": 10.0
      },
      "yearly": {
        "totalDistance": 125000,
        "totalDuration": 45000,
        "totalRuns": 25,
        "averageSpeed": 10.0
      }
    }
  },
  "timestamp": "2026-01-30T11:00:00.000Z"
}
```

---

### 3.2 Get Weekly Stats
**Endpoint:** `GET /api/v1/stats/weekly`  
**Authentication:** Required  

**Description:** Get current week statistics.

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Statistics fetched successfully",
  "data": {
    "stats": {
      "_id": "65b8f9c5d1e4a2b3c4d5e6fc",
      "userId": "65b8f9c5d1e4a2b3c4d5e6f7",
      "periodType": "weekly",
      "periodStart": "2026-01-27T00:00:00.000Z",
      "periodEnd": "2026-02-02T23:59:59.999Z",
      "totalDistance": 15000,
      "totalDuration": 5400,
      "totalRuns": 3,
      "averageSpeed": 10.0,
      "longestRun": 6000,
      "longestDuration": 2100,
      "fastestSpeed": 12.5,
      "createdAt": "2026-01-30T11:00:00.000Z",
      "updatedAt": "2026-01-30T11:00:00.000Z"
    }
  },
  "timestamp": "2026-01-30T11:00:00.000Z"
}
```

---

### 3.3 Get Monthly Stats
**Endpoint:** `GET /api/v1/stats/monthly`  
**Authentication:** Required  

**Description:** Get current month statistics.

---

### 3.4 Get Yearly Stats
**Endpoint:** `GET /api/v1/stats/yearly`  
**Authentication:** Required  

**Description:** Get current year statistics.

---

### 3.5 Refresh Statistics
**Endpoint:** `POST /api/v1/stats/refresh`  
**Authentication:** Required  

**Description:** Recalculate all statistics.

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Statistics updated successfully",
  "data": {
    "stats": {
      "allTime": {},
      "weekly": {},
      "monthly": {},
      "yearly": {}
    }
  },
  "timestamp": "2026-01-30T11:00:00.000Z"
}
```

---

## 4. Users

### 4.1 Get User Profile
**Endpoint:** `GET /api/v1/users/profile`  
**Authentication:** Required  

**Description:** Get user profile information.

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User fetched successfully",
  "data": {
    "user": {
      "_id": "65b8f9c5d1e4a2b3c4d5e6f7",
      "email": "user@example.com",
      "username": "John Runner",
      "profilePicture": "https://example.com/avatar.jpg",
      "isActive": true,
      "lastLoginAt": "2026-01-30T10:00:00.000Z",
      "metadata": {
        "totalRuns": 25,
        "totalDistance": 125000,
        "totalDuration": 45000
      },
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-30T10:00:00.000Z"
    }
  },
  "timestamp": "2026-01-30T11:00:00.000Z"
}
```

---

### 4.2 Update User Profile
**Endpoint:** `PATCH /api/v1/users/profile`  
**Authentication:** Required  

**Description:** Update user profile (username and profile picture).

**Request Body:**
```json
{
  "username": "John Runner Pro",
  "profilePicture": "https://example.com/new-avatar.jpg"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | String | No | Username (3-50 characters) |
| profilePicture | String (URL) | No | Profile picture URL |

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile updated successfully",
  "data": {
    "user": {
      "_id": "65b8f9c5d1e4a2b3c4d5e6f7",
      "email": "user@example.com",
      "username": "John Runner Pro",
      "profilePicture": "https://example.com/new-avatar.jpg",
      "updatedAt": "2026-01-30T11:30:00.000Z"
    }
  },
  "timestamp": "2026-01-30T11:30:00.000Z"
}
```

---

### 4.3 Get User Stats Summary
**Endpoint:** `GET /api/v1/users/stats`  
**Authentication:** Required  

**Description:** Get quick stats summary.

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Statistics fetched successfully",
  "data": {
    "stats": {
      "totalRuns": 25,
      "totalDistance": 125000,
      "totalDuration": 45000,
      "totalDistanceKm": "125.00",
      "totalDurationHours": "12.50"
    }
  },
  "timestamp": "2026-01-30T11:30:00.000Z"
}
```

---

### 4.4 Clear User Data
**Endpoint:** `DELETE /api/v1/users/data`  
**Authentication:** Required  

**Description:** Clear all user runs and statistics (keeps account).

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User data cleared successfully",
  "data": null,
  "timestamp": "2026-01-30T11:30:00.000Z"
}
```

---

### 4.5 Delete Account
**Endpoint:** `DELETE /api/v1/users/account`  
**Authentication:** Required  

**Description:** Permanently delete user account and all data.

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deleted successfully",
  "data": null,
  "timestamp": "2026-01-30T11:30:00.000Z"
}
```

---

## Data Models

### User Model
```dart
class User {
  final String id;
  final String email;
  final String? username;
  final String? profilePicture;
  final bool isActive;
  final DateTime? lastLoginAt;
  final UserMetadata metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    this.username,
    this.profilePicture,
    required this.isActive,
    this.lastLoginAt,
    required this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'],
      email: json['email'],
      username: json['username'],
      profilePicture: json['profilePicture'],
      isActive: json['isActive'],
      lastLoginAt: json['lastLoginAt'] != null 
          ? DateTime.parse(json['lastLoginAt']) 
          : null,
      metadata: UserMetadata.fromJson(json['metadata']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

class UserMetadata {
  final int totalRuns;
  final double totalDistance;
  final int totalDuration;

  UserMetadata({
    required this.totalRuns,
    required this.totalDistance,
    required this.totalDuration,
  });

  factory UserMetadata.fromJson(Map<String, dynamic> json) {
    return UserMetadata(
      totalRuns: json['totalRuns'],
      totalDistance: json['totalDistance'].toDouble(),
      totalDuration: json['totalDuration'],
    );
  }
}
```

### Run Model
```dart
class Run {
  final String id;
  final String runId;
  final String userId;
  final DateTime startTime;
  final DateTime endTime;
  final double distance;
  final int duration;
  final double averageSpeed;
  final double maxSpeed;
  final String? notes;
  final List<LocationPoint> route;
  final bool isDeleted;
  final DateTime createdAt;
  final DateTime updatedAt;

  Run({
    required this.id,
    required this.runId,
    required this.userId,
    required this.startTime,
    required this.endTime,
    required this.distance,
    required this.duration,
    required this.averageSpeed,
    required this.maxSpeed,
    this.notes,
    required this.route,
    required this.isDeleted,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Run.fromJson(Map<String, dynamic> json) {
    return Run(
      id: json['_id'],
      runId: json['id'],
      userId: json['userId'],
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      distance: json['distance'].toDouble(),
      duration: json['duration'],
      averageSpeed: json['averageSpeed'].toDouble(),
      maxSpeed: json['maxSpeed'].toDouble(),
      notes: json['notes'],
      route: (json['route'] as List)
          .map((point) => LocationPoint.fromJson(point))
          .toList(),
      isDeleted: json['isDeleted'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': runId,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'distance': distance,
      'duration': duration,
      'averageSpeed': averageSpeed,
      'maxSpeed': maxSpeed,
      'notes': notes,
      'route': route.map((point) => point.toJson()).toList(),
    };
  }
}
```

### Location Point Model
```dart
class LocationPoint {
  final double latitude;
  final double longitude;
  final DateTime timestamp;
  final double? altitude;
  final double? accuracy;

  LocationPoint({
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    this.altitude,
    this.accuracy,
  });

  factory LocationPoint.fromJson(Map<String, dynamic> json) {
    return LocationPoint(
      latitude: json['latitude'].toDouble(),
      longitude: json['longitude'].toDouble(),
      timestamp: DateTime.parse(json['timestamp']),
      altitude: json['altitude']?.toDouble(),
      accuracy: json['accuracy']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'timestamp': timestamp.toIso8601String(),
      'altitude': altitude,
      'accuracy': accuracy,
    };
  }
}
```

### Stats Model
```dart
class Stats {
  final String id;
  final String userId;
  final String periodType;
  final DateTime periodStart;
  final DateTime periodEnd;
  final double totalDistance;
  final int totalDuration;
  final int totalRuns;
  final double averageSpeed;
  final double longestRun;
  final int longestDuration;
  final double fastestSpeed;

  Stats({
    required this.id,
    required this.userId,
    required this.periodType,
    required this.periodStart,
    required this.periodEnd,
    required this.totalDistance,
    required this.totalDuration,
    required this.totalRuns,
    required this.averageSpeed,
    required this.longestRun,
    required this.longestDuration,
    required this.fastestSpeed,
  });

  factory Stats.fromJson(Map<String, dynamic> json) {
    return Stats(
      id: json['_id'],
      userId: json['userId'],
      periodType: json['periodType'],
      periodStart: DateTime.parse(json['periodStart']),
      periodEnd: DateTime.parse(json['periodEnd']),
      totalDistance: json['totalDistance'].toDouble(),
      totalDuration: json['totalDuration'],
      totalRuns: json['totalRuns'],
      averageSpeed: json['averageSpeed'].toDouble(),
      longestRun: json['longestRun'].toDouble(),
      longestDuration: json['longestDuration'],
      fastestSpeed: json['fastestSpeed'].toDouble(),
    );
  }
}
```

---

## Status Codes

| Status Code | Meaning | When Used |
|------------|---------|-----------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | User inactive or insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., run ID exists) |
| 422 | Unprocessable Entity | Semantic validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Server temporarily down |

---

## Flutter API Service Example

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  final String baseUrl = 'http://localhost:3000';
  final storage = const FlutterSecureStorage();

  // Authentication
  Future<Map<String, dynamic>> login(String email) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await storage.write(key: 'auth_token', value: data['data']['token']);
      return data;
    } else {
      throw Exception('Login failed');
    }
  }

  // Get authenticated headers
  Future<Map<String, String>> _getHeaders() async {
    final token = await storage.read(key: 'auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Create Run
  Future<Map<String, dynamic>> createRun(Run run) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/runs'),
      headers: headers,
      body: jsonEncode(run.toJson()),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else if (response.statusCode == 401) {
      throw UnauthorizedException('Session expired');
    } else {
      throw Exception('Failed to create run');
    }
  }

  // Get Runs
  Future<Map<String, dynamic>> getRuns({int page = 1, int limit = 10}) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/api/v1/runs?page=$page&limit=$limit'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch runs');
    }
  }

  // Get Stats Overview
  Future<Map<String, dynamic>> getStatsOverview() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/api/v1/stats/overview'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch stats');
    }
  }
}

class UnauthorizedException implements Exception {
  final String message;
  UnauthorizedException(this.message);
}
```

---

## Notes for Implementation

1. **Token Storage**: Use `flutter_secure_storage` package to store JWT tokens securely
2. **Token Expiry**: Implement token refresh logic or redirect to login when 401 is received
3. **Error Handling**: Create custom exception classes for different error types
4. **Retry Logic**: Implement retry logic for network failures
5. **Offline Support**: Cache runs locally using SQLite (drift package)
6. **File Upload**: For profile pictures, implement multipart/form-data uploads
7. **Real-time Updates**: Consider WebSocket for real-time tracking updates
8. **Background Location**: Use `background_location` package for tracking while app is in background

---

**API Version:** 1.0.0  
**Last Updated:** January 30, 2026  
**Contact:** dev@onekot.com
