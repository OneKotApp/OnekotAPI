require('dotenv').config();
const database = require('../config/database');
const app = require('../src/app');

// Connect to database on cold start
let dbConnected = false;

const connectDB = async () => {
  if (!dbConnected) {
    try {
      await database.connect();
      dbConnected = true;
      console.log('MongoDB connected for serverless function');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }
};

// Export the Express app for Vercel serverless
module.exports = async (req, res) => {
  // Ensure database is connected
  await connectDB();
  
  // Let Express handle the request
  return app(req, res);
};
