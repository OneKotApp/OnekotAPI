# OneKot API Server

A production-ready REST API server for the OneKot running and mapping mobile application. Built with Node.js, Express.js, and MongoDB Atlas, following clean architecture principles and industry best practices.

## 🚀 Features

- **Email-only Authentication** (MVP) with JWT tokens
- **Run Tracking** - Create, retrieve, update, and delete run sessions with optional area tagging
- **Leaderboards** - Area and distance-based rankings with pagination
- **Community Map** - View all community runs with area information
- **Statistics** - Comprehensive stats (daily, weekly, monthly, yearly, all-time)
- **Location Points** - Store and retrieve GPS route data
- **User Management** - Profile management and activity tracking
- **Login Activity** - Track user logins with device and location info
- **Security** - NoSQL injection prevention, XSS protection, input sanitization
- **Rate Limiting** - Protection against abuse and DoS attacks
- **Error Handling** - Comprehensive error handling with proper HTTP status codes
- **Validation** - Request validation using express-validator with security sanitization
- **Clean Architecture** - Separation of concerns with controllers, services, and models

## 📁 Project Structure

```
onekotAPI/
├── config/
│   └── database.js              # MongoDB connection configuration
├── src/
│   ├── controllers/             # Request handlers
│   │   ├── authController.js
│   │   ├── runController.js
│   │   ├── statsController.js
│   │   └── userController.js
│   ├── services/                # Business logic
│   │   ├── authService.js
│   │   ├── runService.js
│   │   ├── statsService.js
│   │   └── userService.js
│   ├── models/                  # MongoDB schemas
│   │   ├── User.js
│   │   ├── Run.js
│   │   ├── LocationPoint.js
│   │   ├── Stats.js
│   │   └── LoginActivity.js
│   ├── middlewares/             # Express middlewares
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── validator.js
│   │   ├── sanitizeInput.js     # Security: NoSQL injection prevention
│   │   └── rateLimiter.js
│   ├── routes/                  # API routes
│   │   ├── auth.routes.js
│   │   ├── run.routes.js
│   │   ├── stats.routes.js
│   │   └── user.routes.js
│   ├── utils/                   # Utility functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── constants.js
│   │   └── helpers.js
│   └── app.js                   # Express app configuration
├── .env                         # Environment variables
├── .env.example                 # Environment variables example
├── .gitignore                   # Git ignore file
├── server.js                    # Server entry point
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🛠️ Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account

### Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd onekotAPI
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the MongoDB password in `.env`:

```env
MONGODB_URI=mongodb+srv://adityatechdevelopers_db_user:YOUR_PASSWORD@onekotmap.3smudkz.mongodb.net/?appName=OnekotMap
```

4. **Start the server**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login with email
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `GET /api/v1/auth/login-history` - Get login history (requires auth)

### Runs

- `POST /api/v1/runs` - Create new run
- `GET /api/v1/runs` - Get all runs (paginated)
- `GET /api/v1/runs/:id` - Get specific run
- `GET /api/v1/runs/recent` - Get recent runs
- `GET /api/v1/runs/date-range` - Get runs by date range
- `GET /api/v1/runs/:id/location-points` - Get run location points
- `PATCH /api/v1/runs/:id` - Update run notes
- `DELETE /api/v1/runs/:id` - Delete run (soft delete)

### Statistics

- `GET /api/v1/stats/overview` - Get comprehensive stats
- `GET /api/v1/stats/all-time` - Get all-time stats
- `GET /api/v1/stats/weekly` - Get weekly stats
- `GET /api/v1/stats/monthly` - Get monthly stats
- `GET /api/v1/stats/yearly` - Get yearly stats
- `POST /api/v1/stats/refresh` - Refresh all statistics

### Users

- `GET /api/v1/users/profile` - Get user profile
- `PATCH /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/stats` - Get user stats summary
- `GET /api/v1/users/activity` - Get user activity overview
- `DELETE /api/v1/users/data` - Clear all user data
- `DELETE /api/v1/users/account` - Delete user account

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. For MVP purposes, authentication is simplified to email-only.

### Login Request

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "deviceInfo": {
    "deviceName": "iPhone 14",
    "osName": "iOS",
    "osVersion": "17.0"
  },
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "city": "Mumbai",
    "country": "India"
  }
}
```

### Using the Token

Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## 📊 Data Models

### User
- Email (unique)
- Username
- Profile picture
- Metadata (total runs, distance, duration)

### Run
- ID (timestamp-based)
- User ID
- Start/End time
- Distance (meters)
- Duration (seconds)
- Average/Max speed
- Route (array of location points)

### Location Point
- Run ID
- Latitude/Longitude
- Timestamp
- Altitude
- Accuracy

### Stats
- Period type (daily, weekly, monthly, yearly, all-time)
- Total distance, duration, runs
- Average/fastest speed
- Longest run/duration

### Login Activity
- User ID
- Login time
- Device info
- Location
- IP address

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent abuse
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Validate all inputs
- **Error Handling** - Secure error responses

## 🚦 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

## 📈 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { /* response data */ },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test API documentation
curl http://localhost:3000/api/v1
```

## 📚 API Documentation

Comprehensive documentation for all API features:

- **[API Testing Guide](API_TESTING.md)** - Complete API testing examples
- **[Flutter Integration](FLUTTER_API_DOCUMENTATION.md)** - Flutter/Dart client integration
- **[Community Map API](COMMUNITY_MAP_API.md)** - Community mapping features
- **[Leaderboard API](LEADERBOARD_API.md)** - Rankings and leaderboard features
- **[Bulk Sync Guide](BULK_SYNC_GUIDE.md)** - Offline sync functionality
- **[Security Guide](SECURITY.md)** - Security best practices and protections
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions

## 🔒 Security

This API implements comprehensive security measures with minimal performance overhead:

- **NoSQL Injection Prevention** - Automatic sanitization of all inputs
- **XSS Protection** - HTML/script tag removal and CSP headers
- **Prototype Pollution Prevention** - Object structure validation
- **Rate Limiting** - DoS/brute force protection
- **Input Validation** - Strict type and format validation
- **HTTPS Enforcement** - Secure transport layer
- **Security Headers** - Helmet.js configuration

**Performance Impact:** < 5ms per request

See [SECURITY.md](SECURITY.md) for detailed security documentation.

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `MONGODB_DB_NAME` | Database name | onekot_map_api |
| `JWT_SECRET` | Secret for JWT signing | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `ALLOWED_ORIGINS` | CORS allowed origins | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## 📝 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## 🚀 Deployment

### Deploy to Vercel

This project is configured for easy deployment to Vercel.

**Quick Deploy:**
1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy!

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

**One-Click Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/OneKotApp/OnekotAPI)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Team

OneKot Development Team

---

**Built with ❤️ for OneKot**
