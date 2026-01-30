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
| `userId` | String | User who created the run |
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

## 💻 Code Examples

### JavaScript/TypeScript

```javascript
async function fetchCommunityMap(token, options = {}) {
  const { page = 1, limit = 50, boundingBox = null } = options;
  
  let url = `https://onekot-api.vercel.app/api/v1/runs/community-map?page=${page}&limit=${limit}`;
  
  // Add bounding box if provided (for visible map area)
  if (boundingBox) {
    const { minLat, maxLat, minLng, maxLng } = boundingBox;
    url += `&minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`;
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch community map');
    }
    
    console.log(`Loaded ${data.data.length} runs`);
    console.log(`Total runs: ${data.meta.pagination.totalItems}`);
    
    return data;
  } catch (error) {
    console.error('Error fetching community map:', error.message);
    throw error;
  }
}

// Usage 1: Load all runs (with pagination)
const token = 'your_jwt_token_here';
const communityData = await fetchCommunityMap(token, { page: 1, limit: 100 });

// Usage 2: Load runs within map viewport
const mapBounds = {
  minLat: 40.7,
  maxLat: 40.8,
  minLng: -74.1,
  maxLng: -74.0,
};
const visibleRuns = await fetchCommunityMap(token, { 
  page: 1, 
  limit: 100, 
  boundingBox: mapBounds 
});

// Plot runs on map
communityData.data.forEach(run => {
  run.route.forEach(point => {
    // Add marker or polyline to map
    console.log(`Point: ${point.latitude}, ${point.longitude}`);
  });
});
```

### Dart/Flutter with Google Maps

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:google_maps_flutter/google_maps_flutter.dart';

class CommunityMapService {
  final String baseUrl = 'https://onekot-api.vercel.app/api/v1';
  
  Future<List<Polyline>> fetchCommunityMap({
    required String token,
    int page = 1,
    int limit = 100,
    LatLngBounds? bounds,
  }) async {
    var url = '$baseUrl/runs/community-map?page=$page&limit=$limit';
    
    // Add bounding box if map bounds provided
    if (bounds != null) {
      url += '&minLat=${bounds.southwest.latitude}'
             '&maxLat=${bounds.northeast.latitude}'
             '&minLng=${bounds.southwest.longitude}'
             '&maxLng=${bounds.northeast.longitude}';
    }
    
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to fetch community map');
      }
      
      final data = jsonDecode(response.body);
      final runs = data['data'] as List<dynamic>;
      
      print('Loaded ${runs.length} runs');
      print('Total runs: ${data['meta']['pagination']['totalItems']}');
      
      // Convert runs to polylines for map display
      List<Polyline> polylines = [];
      
      for (var i = 0; i < runs.length; i++) {
        final run = runs[i];
        final route = run['route'] as List<dynamic>;
        
        if (route.length < 2) continue;
        
        List<LatLng> points = route.map((point) {
          return LatLng(
            point['latitude'] as double,
            point['longitude'] as double,
          );
        }).toList();
        
        polylines.add(Polyline(
          polylineId: PolylineId(run['id']),
          points: points,
          color: Colors.blue.withOpacity(0.6),
          width: 3,
          geodesic: true,
        ));
      }
      
      return polylines;
    } catch (e) {
      print('Error fetching community map: $e');
      rethrow;
    }
  }
}

// Usage in your widget
class CommunityMapScreen extends StatefulWidget {
  @override
  _CommunityMapScreenState createState() => _CommunityMapScreenState();
}

class _CommunityMapScreenState extends State<CommunityMapScreen> {
  GoogleMapController? _mapController;
  Set<Polyline> _polylines = {};
  final _mapService = CommunityMapService();
  
  @override
  void initState() {
    super.initState();
    _loadCommunityRuns();
  }
  
  Future<void> _loadCommunityRuns() async {
    final token = 'your_jwt_token_here';
    
    try {
      // Get visible map bounds
      LatLngBounds? bounds;
      if (_mapController != null) {
        bounds = await _mapController!.getVisibleRegion();
      }
      
      final polylines = await _mapService.fetchCommunityMap(
        token: token,
        limit: 100,
        bounds: bounds,
      );
      
      setState(() {
        _polylines = polylines.toSet();
      });
    } catch (e) {
      print('Error loading community runs: $e');
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Community Map')),
      body: GoogleMap(
        initialCameraPosition: CameraPosition(
          target: LatLng(40.7128, -74.0060),
          zoom: 12,
        ),
        polylines: _polylines,
        onMapCreated: (controller) {
          _mapController = controller;
          _loadCommunityRuns();
        },
        onCameraIdle: () {
          // Reload runs when user stops panning/zooming
          _loadCommunityRuns();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadCommunityRuns,
        child: Icon(Icons.refresh),
      ),
    );
  }
}
```

### Python

```python
import requests
from typing import List, Dict, Any, Optional

class CommunityMapAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def fetch_community_map(
        self,
        page: int = 1,
        limit: int = 100,
        bounding_box: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Fetch community runs for map plotting
        
        Args:
            page: Page number
            limit: Number of runs per page (max 100)
            bounding_box: Optional dict with minLat, maxLat, minLng, maxLng
            
        Returns:
            Dict containing runs and pagination info
        """
        url = f'{self.base_url}/runs/community-map?page={page}&limit={limit}'
        
        if bounding_box:
            url += (f"&minLat={bounding_box['minLat']}"
                   f"&maxLat={bounding_box['maxLat']}"
                   f"&minLng={bounding_box['minLng']}"
                   f"&maxLng={bounding_box['maxLng']}")
        
        try:
            response = requests.get(url, headers=self.headers)
            data = response.json()
            
            if response.status_code != 200:
                raise Exception(data.get('message', 'Failed to fetch community map'))
            
            print(f"Loaded {len(data['data'])} runs")
            print(f"Total runs: {data['meta']['pagination']['totalItems']}")
            
            return data
        except Exception as e:
            print(f"Error fetching community map: {str(e)}")
            raise

# Usage
api = CommunityMapAPI(
    base_url='https://onekot-api.vercel.app/api/v1',
    token='your_jwt_token_here'
)

# Load all runs
community_data = api.fetch_community_map(page=1, limit=100)

# Load runs within specific area (e.g., New York City)
nyc_bounds = {
    'minLat': 40.7,
    'maxLat': 40.8,
    'minLng': -74.1,
    'maxLng': -74.0
}
nyc_runs = api.fetch_community_map(page=1, limit=100, bounding_box=nyc_bounds)

# Process runs
for run in community_data['data']:
    print(f"Run {run['id']}: {run['distance']}m, {len(run['route'])} points")
    for point in run['route']:
        print(f"  - {point['latitude']}, {point['longitude']}")
```

---

## 🎯 Use Cases

### 1. **Heat Map Visualization**
Show popular running areas based on density of routes:
```javascript
const runs = await fetchCommunityMap(token, { limit: 100 });
const heatmapData = runs.data.flatMap(run => 
  run.route.map(point => ({ lat: point.latitude, lng: point.longitude }))
);
// Use with Google Maps Heatmap Layer or similar
```

### 2. **Route Discovery**
Find interesting routes in your area:
```javascript
const myLocation = { minLat: 40.7, maxLat: 40.8, minLng: -74.1, maxLng: -74.0 };
const nearbyRuns = await fetchCommunityMap(token, { 
  limit: 50, 
  boundingBox: myLocation 
});
```

### 3. **Performance Tracking**
Load runs incrementally as user pans the map:
```javascript
mapInstance.on('moveend', async () => {
  const bounds = mapInstance.getBounds();
  const runs = await fetchCommunityMap(token, {
    boundingBox: {
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    }
  });
  updateMapPolylines(runs.data);
});
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
- Different colors for different users (optional)
- Cluster nearby routes to reduce visual clutter
- Show loading indicator while fetching

### 3. **Data Privacy**
- Only essential data is returned (no user personal info)
- Users are represented by userId (anonymous)
- No email, username, or profile data exposed

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
- ✅ Anonymous userId (for tracking individual users if needed)

### What's NOT Included
- ❌ User email
- ❌ User username
- ❌ User profile information
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
