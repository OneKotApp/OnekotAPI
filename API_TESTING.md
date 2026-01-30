# OneKot API Testing Guide

This guide provides sample requests for testing the OneKot API endpoints.

## Base URL
```
http://localhost:3000
```

## Environment Variables
Make sure your `.env` file is configured with the correct MongoDB password.

---

## 1. Health Check

### Check Server Health
```bash
curl http://localhost:3000/health
```

### Check API Documentation
```bash
curl http://localhost:3000/api/v1
```

---

## 2. Authentication Endpoints

### Login (Create/Get User)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aditya@onekot.com",
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
  }'
```

**Save the token from the response for authenticated requests!**

### Get Current User
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Login History
```bash
curl http://localhost:3000/api/v1/auth/login-history?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. Run Endpoints

### Create a Run
```bash
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
  }'
```

### Get All Runs (Paginated)
```bash
curl "http://localhost:3000/api/v1/runs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Recent Runs
```bash
curl "http://localhost:3000/api/v1/runs/recent?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Runs by Date Range
```bash
curl "http://localhost:3000/api/v1/runs/date-range?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Specific Run
```bash
curl http://localhost:3000/api/v1/runs/RUN_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Run Location Points
```bash
curl http://localhost:3000/api/v1/runs/RUN_ID_HERE/location-points \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Run Notes
```bash
curl -X PATCH http://localhost:3000/api/v1/runs/RUN_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "notes": "Updated notes: Great morning run!"
  }'
```

### Delete Run
```bash
curl -X DELETE http://localhost:3000/api/v1/runs/RUN_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 4. Statistics Endpoints

### Get Stats Overview (All Periods)
```bash
curl http://localhost:3000/api/v1/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get All-Time Stats
```bash
curl http://localhost:3000/api/v1/stats/all-time \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Weekly Stats
```bash
curl http://localhost:3000/api/v1/stats/weekly \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Monthly Stats
```bash
curl http://localhost:3000/api/v1/stats/monthly \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Yearly Stats
```bash
curl http://localhost:3000/api/v1/stats/yearly \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Refresh Statistics
```bash
curl -X POST http://localhost:3000/api/v1/stats/refresh \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 5. User Endpoints

### Get User Profile
```bash
curl http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update User Profile
```bash
curl -X PATCH http://localhost:3000/api/v1/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "username": "Aditya Runner",
    "profilePicture": "https://example.com/avatar.jpg"
  }'
```

### Get User Stats Summary
```bash
curl http://localhost:3000/api/v1/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get User Activity Overview
```bash
curl http://localhost:3000/api/v1/users/activity \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Clear User Data
```bash
curl -X DELETE http://localhost:3000/api/v1/users/data \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Delete User Account
```bash
curl -X DELETE http://localhost:3000/api/v1/users/account \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Deactivate Account
```bash
curl -X POST http://localhost:3000/api/v1/users/deactivate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Activate Account
```bash
curl -X POST http://localhost:3000/api/v1/users/activate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing Workflow

1. **Start the Server**
   ```bash
   npm run dev
   ```

2. **Test Health Check**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Login and Get Token**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@onekot.com"}'
   ```

4. **Copy the token from response and replace `YOUR_TOKEN_HERE` in subsequent requests**

5. **Create a Run** (use the curl command above)

6. **Get Your Runs** to verify the run was created

7. **Check Statistics** to see aggregated data

---

## Using Postman or Thunder Client

You can also import these requests into Postman or Thunder Client VS Code extension:

1. Create a new collection
2. Add environment variable `token` for authentication
3. Set `Authorization` header as `Bearer {{token}}`
4. Import the requests above

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data fetched successfully",
  "data": [ /* array of items */ ],
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

---

## Notes

- Replace `YOUR_TOKEN_HERE` with the actual JWT token from login response
- Replace `RUN_ID_HERE` with actual run ID from your database
- All timestamps should be in ISO 8601 format
- Distances are in meters
- Durations are in seconds
- Speeds are in km/h
- Coordinates are in decimal degrees

---

**Happy Testing! 🚀**
