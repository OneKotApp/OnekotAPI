const ApiError = require('../utils/ApiError');
const { MESSAGES, NODE_ENV } = require('../utils/constants');

/**
 * Global error handling middleware
 * Catches all errors and sends appropriate response
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error for debugging
  if (process.env.NODE_ENV === NODE_ENV.DEVELOPMENT) {
    console.error('Error:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: err.stack,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = ApiError.notFound(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = ApiError.conflict(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = ApiError.badRequest(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message || MESSAGES.INTERNAL_ERROR,
    ...(process.env.NODE_ENV === NODE_ENV.DEVELOPMENT && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Middleware for handling 404 errors
 */
const notFound = (req, res, next) => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Middleware for handling uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
  });
};

/**
 * Middleware for handling unhandled promise rejections
 */
const handleUnhandledRejection = (server) => {
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    server.close(() => {
      process.exit(1);
    });
  });
};

module.exports = {
  errorHandler,
  notFound,
  handleUncaughtException,
  handleUnhandledRejection,
};
