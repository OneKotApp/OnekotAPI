# Run API Documentation

## Create Run
**POST** `/api/runs`

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "startTime": "2026-02-02T10:00:00Z",
  "endTime": "2026-02-02T10:30:00Z",
  "distance": 5500,
  "duration": 1800,
  "averageSpeed": 3.05,
  "maxSpeed": 4.2,
  "area": "Central Park",
  "totalArea": 125000.50,
  "notes": "Morning run",
  "route": [
    {
      "latitude": 40.785091,
      "longitude": -73.968285,
      "timestamp": "2026-02-02T10:00:00Z",
      "altitude": 15.5,
      "accuracy": 5.0
    }
  ]
}
```

### Response (201)
```json
{
  "success": true,
  "message": "Run created successfully",
  "data": {
    "run": {
      "id": "run_1707048000",
      "userId": "65d0987654321fedcba98765",
      "startTime": "2026-02-02T10:00:00.000Z",
      "endTime": "2026-02-02T10:30:00.000Z",
      "distance": 5500,
      "duration": 1800,
      "averageSpeed": 3.05,
      "maxSpeed": 4.2,
      "area": "Central Park",
      "totalArea": 125000.50,
      "notes": "Morning run",
      "route": [...],
      "createdAt": "2026-02-02T10:31:00.000Z"
    }
  }
}
```

### Errors
- **400** - Validation error (invalid data format)
- **401** - Unauthorized (invalid/missing token)
- **409** - Conflict (duplicate run ID)

---

## Bulk Create Runs
**POST** `/api/runs/bulk`

### Request Body
```json
{
  "runs": [
    {
      "id": "run_1234567890",
      "startTime": "2026-02-02T10:00:00Z",
      "endTime": "2026-02-02T10:30:00Z",
      "distance": 5500,
      "duration": 1800,
      "averageSpeed": 3.05,
      "area": "Hyde Park",
      "totalArea": 85000,
      "route": [...]
    }
  ]
}
```

### Response (201)
```json
{
  "success": true,
  "message": "Bulk run creation completed",
  "data": {
    "summary": {
      "total": 2,
      "created": 2,
      "skipped": 0,
      "errors": 0
    },
    "successful": [...],
    "failed": []
  }
}
```

### Errors
- **400** - Validation error
- **401** - Unauthorized

---

## Get User Runs
**GET** `/api/runs?page=1&limit=10`

### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### Response (200)
```json
{
  "success": true,
  "message": "Runs fetched successfully",
  "data": {
    "runs": [
      {
        "id": "run_1707048000",
        "distance": 5500,
        "duration": 1800,
        "area": "Central Park",
        "totalArea": 125000.50,
        "startTime": "2026-02-02T10:00:00.000Z",
        "createdAt": "2026-02-02T10:31:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 45,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Errors
- **401** - Unauthorized

---

## Get Community Runs
**GET** `/api/runs/community?page=1&limit=50&minLat=40.7&maxLat=40.8&minLng=-74.0&maxLng=-73.9`

### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `minLat`, `maxLat`, `minLng`, `maxLng` (optional): Bounding box coordinates

### Response (200)
```json
{
  "success": true,
  "message": "Community runs fetched successfully",
  "data": [
    {
      "id": "run_1707048000",
      "userId": "65d0987654321fedcba98765",
      "username": "john_runner",
      "runColor": "#FF6B6B",
      "distance": 5500,
      "duration": 1800,
      "area": "Central Park",
      "totalArea": 125000.50,
      "startTime": "2026-02-02T10:00:00.000Z",
      "route": [...],
      "createdAt": "2026-02-02T10:31:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### Errors
- **400** - Invalid coordinates
- **401** - Unauthorized

---

## Area Leaderboard
**GET** `/api/runs/leaderboard/area?page=1&limit=10`

### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

### Response (200)
```json
{
  "success": true,
  "message": "Area leaderboard fetched successfully",
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "area": "Central Park",
        "totalRuns": 156,
        "totalDistance": 1248.5,
        "uniqueUsers": 42,
        "runs": [
          {
            "id": "run_1234567890",
            "userId": "507f1f77bcf86cd799439011",
            "username": "john_runner",
            "distance": 5.5,
            "duration": 1800,
            "area": "Central Park",
            "totalArea": 125000.50,
            "createdAt": "2026-01-10T08:00:00.000Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 87,
      "totalPages": 9,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Errors
- **400** - Invalid pagination parameters
- **401** - Unauthorized

---

## Distance Leaderboard
**GET** `/api/runs/leaderboard/distance?page=1&limit=10`

### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

### Response (200)
```json
{
  "success": true,
  "message": "Distance leaderboard fetched successfully",
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "507f1f77bcf86cd799439011",
        "username": "john_runner",
        "email": "john@example.com",
        "totalDistance": 1248.5,
        "totalRuns": 89,
        "averageDistance": 14.03,
        "lastRunDate": "2026-02-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1523,
      "totalPages": 153,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Errors
- **400** - Invalid pagination parameters
- **401** - Unauthorized

---

## Field Specifications

### area (String)
- **Optional**: Location/area name where the run took place
- **Max Length**: 100 characters
- **Example**: `"Central Park"`, `"Riverside Trail"`

### totalArea (Number)
- **Optional**: Geographical coverage area in square meters (m²)
- **Unit**: m²
- **Min Value**: 0
- **Example**: `125000.50` (= 0.125 km²)
- **Note**: Convert to km² in app: `totalArea / 1000000`
