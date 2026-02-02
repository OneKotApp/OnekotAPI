# Community Map API

## Overview

This endpoint allows authenticated users to fetch all community runs from all users for plotting on a community map. This helps visualize popular running routes and areas.

---

## 🗺️ Community Map Endpoint

### Endpoint

```
GET /api/v1/runs/community-map
```

### Description

Retrieves runs from all users (not just the authenticated user) for community map visualization. The endpoint is authenticated to prevent abuse but returns data from all users.

### Authentication

**Required.** Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Features

- ✅ Returns runs from all users
- ✅ Pagination support
- ✅ Optional bounding box filtering (for map viewport)
- ✅ Excludes deleted runs
- ✅ Only returns runs with valid route data
- ✅ Sorted by most recent first

---

## 📤 Request Format

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Number | No | 1 | Page number for pagination |
| `limit` | Number | No | 10 | Number of runs per page (max 100) |
| `minLat` | Number | No | - | Minimum latitude for bounding box filter |
| `maxLat` | Number | No | - | Maximum latitude for bounding box filter |
| `minLng` | Number | No | - | Minimum longitude for bounding box filter |
| `maxLng` | Number | No | - | Maximum longitude for bounding box filter |

### Example Requests

#### Basic Request (No Filtering)

```bash
curl -X GET "https://onekot-api.vercel.app/api/v1/runs/community-map?page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### With Bounding Box (Map Viewport Filtering)

```bash
curl -X GET "https://onekot-api.vercel.app/api/v1/runs/community-map?page=1&limit=100&minLat=40.7&maxLat=40.8&minLng=-74.1&maxLng=-74.0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📥 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Community runs fetched successfully",
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "id": "1738195200000_user123",
      "userId": "65f1234567890abcdef00001",
      "username": "RunnerJohn",
      "runColor": "#FF6B6B",
      "startTime": "2026-01-30T10:00:00.000Z",
      "endTime": "2026-01-30T10:30:00.000Z",
      "distance": 5000,
      "duration": 1800,
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
        },
        {
          "latitude": 40.7148,
          "longitude": -74.0080,
          "timestamp": "2026-01-30T10:10:00.000Z",
          "altitude": 15,
          "accuracy": 5
        }
      ],
      "createdAt": "2026-01-30T10:31:00.000Z"
    },
    {
      "_id": "65f1234567890abcdef12346",
      "id": "1738195200000_user456",
      "userId": "65f1234567890abcdef00002",
      "username": "SpeedRunner99",
      "runColor": "#4ECDC4",
      "startTime": "2026-01-30T14:00:00.000Z",
      "endTime": "2026-01-30T14:45:00.000Z",
      "distance": 7500,
      "duration": 2700,
      "route": [
        {
          "latitude": 40.7200,
          "longitude": -74.0100,
          "timestamp": "2026-01-30T14:00:00.000Z"
        },
        {
          "latitude": 40.7220,
          "longitude": -74.0120,
          "timestamp": "2026-01-30T14:10:00.000Z"
        }
      ],
      "createdAt": "2026-01-30T14:46:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2026-01-31T12:00:00.000Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | MongoDB document ID |
| `id` | String | Unique run identifier |
| `userId` | String | User ID who created the run |
| `username` | String | Username of the runner (defaults to "Runner" if not set) |
| `runColor` | String | Hex color code for the user's runs (e.g., "#FF6B6B") |
| `startTime` | String | Run start time (ISO 8601) |
| `endTime` | String | Run end time (ISO 8601) |
| `distance` | Number | Total distance in meters |
| `duration` | Number | Total duration in seconds |
| `route` | Array | Array of GPS coordinates with timestamps |
| `createdAt` | String | When the run was uploaded (ISO 8601) |

---

## ⚠️ Error Handling

### Authentication Error (401 Unauthorized)

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication token is required",
  "timestamp": "2026-01-31T12:00:00.000Z"
}
```

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "page: Page must be a positive integer",
  "timestamp": "2026-01-31T12:00:00.000Z"
}
```

### Rate Limit Error (429 Too Many Requests)

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests, please try again later",
  "timestamp": "2026-01-31T12:00:00.000Z"
}
```

---

## 🔍 Best Practices

### 1. **Performance Optimization**
- Use bounding box filtering to load only visible runs
- Set appropriate page limit (50-100 for maps)
- Implement lazy loading as user pans map
- Cache results to reduce API calls

### 2. **Map Display**
- Use semi-transparent polylines for better visibility
- Use different colors per user (provided in `runColor` field)
- Cluster nearby routes to reduce visual clutter
- Show loading indicator while fetching

### 3. **Data Privacy**
- Only essential data is returned (no user email or sensitive info)
- Users can choose their display username and run color
- No profile pictures or sensitive personal data exposed

### 4. **Rate Limiting**
- Don't reload on every map movement
- Debounce map move events (wait 500ms after user stops)
- Cache data for recently viewed areas

---

## 📊 Response Size Estimation

Approximate response sizes to help with data planning:

| Runs | Points per Run | Approx Size |
|------|---------------|-------------|
| 10 | 50 | ~25 KB |
| 50 | 50 | ~125 KB |
| 100 | 50 | ~250 KB |
| 100 | 200 | ~1 MB |

**Recommendation:** Keep limit at 50-100 runs per request for optimal performance.

---

## 🔐 Privacy & Security

### What's Included
- ✅ Run routes and timestamps
- ✅ Distance and duration
- ✅ Username (display name chosen by user, defaults to "Runner")
- ✅ Run color (hex color code for map visualization)
- ✅ UserId (for tracking individual users if needed)

### What's NOT Included
- ❌ User email
- ❌ User profile picture
- ❌ User personal information
- ❌ Deleted runs
- ❌ Notes (might contain personal info)

---

## 📞 Support

For additional help or to report issues:
- GitHub Issues: https://github.com/OneKotApp/OnekotAPI/issues
- API Documentation: https://onekot-api.vercel.app/api/v1

---

## 📝 Notes

- The endpoint requires authentication to prevent abuse
- Returns runs from ALL users, not just the authenticated user
- Pagination recommended for better performance
- Bounding box filtering helps load only relevant data
- Routes are sorted by most recent first
- Only non-deleted runs with valid route data are returned
