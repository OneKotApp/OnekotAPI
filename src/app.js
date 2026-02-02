require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { noSQLProtection } = require('./middlewares/sanitizeInput');
const { NODE_ENV } = require('./utils/constants');

// Import routes
const authRoutes = require('./routes/auth.routes');
const runRoutes = require('./routes/run.routes');
const statsRoutes = require('./routes/stats.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Security middleware - Helmet for HTTP headers security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // Cache preflight requests for 24 hours
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL injection protection (lightweight, email-safe)
app.use(noSQLProtection);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === NODE_ENV.DEVELOPMENT) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OneKot API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/runs', runRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/users', userRoutes);

// API documentation route
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OneKot REST API v1',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me',
        loginHistory: 'GET /api/v1/auth/login-history',
      },
      runs: {
        create: 'POST /api/v1/runs',
        getAll: 'GET /api/v1/runs',
        getById: 'GET /api/v1/runs/:id',
        recent: 'GET /api/v1/runs/recent',
        dateRange: 'GET /api/v1/runs/date-range',
        locationPoints: 'GET /api/v1/runs/:id/location-points',
        update: 'PATCH /api/v1/runs/:id',
        delete: 'DELETE /api/v1/runs/:id',
      },
      stats: {
        overview: 'GET /api/v1/stats/overview',
        allTime: 'GET /api/v1/stats/all-time',
        weekly: 'GET /api/v1/stats/weekly',
        monthly: 'GET /api/v1/stats/monthly',
        yearly: 'GET /api/v1/stats/yearly',
        refresh: 'POST /api/v1/stats/refresh',
      },
      users: {
        profile: 'GET /api/v1/users/profile',
        updateProfile: 'PATCH /api/v1/users/profile',
        stats: 'GET /api/v1/users/stats',
        activity: 'GET /api/v1/users/activity',
        clearData: 'DELETE /api/v1/users/data',
        deleteAccount: 'DELETE /api/v1/users/account',
      },
    },
    documentation: 'https://github.com/your-repo/onekotAPI',
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
