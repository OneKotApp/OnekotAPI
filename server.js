require('dotenv').config();
const app = require('./src/app');
const database = require('./config/database');
const { handleUncaughtException, handleUnhandledRejection } = require('./src/middlewares/errorHandler');

// Handle uncaught exceptions
handleUncaughtException();

const PORT = process.env.PORT || 3000;

// Start server function
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ======================================');
      console.log(`🚀 OneKot API Server is running`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 Port: ${PORT}`);
      console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
      console.log(`🚀 API Docs: http://localhost:${PORT}/api/v1`);
      console.log('🚀 ======================================');
      console.log('');
    });

    // Handle unhandled promise rejections
    handleUnhandledRejection(server);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await database.disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await database.disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
