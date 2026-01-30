const mongoose = require('mongoose');

const runSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    distance: {
      type: Number,
      required: [true, 'Distance is required'],
      min: [0, 'Distance cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0, 'Duration cannot be negative'],
    },
    averageSpeed: {
      type: Number,
      required: [true, 'Average speed is required'],
      min: [0, 'Average speed cannot be negative'],
    },
    maxSpeed: {
      type: Number,
      default: 0,
      min: [0, 'Max speed cannot be negative'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },
    route: {
      type: [
        {
          latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90,
          },
          longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180,
          },
          timestamp: {
            type: Date,
            required: true,
          },
          altitude: {
            type: Number,
            default: null,
          },
          accuracy: {
            type: Number,
            default: null,
            min: 0,
          },
        },
      ],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Route must contain at least one location point',
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'runs',
  }
);

// Compound indexes for efficient queries
runSchema.index({ userId: 1, startTime: -1 });
runSchema.index({ userId: 1, isDeleted: 1, startTime: -1 });
runSchema.index({ startTime: -1 });
runSchema.index({ isDeleted: 1 });

// Virtual for calculating duration in hours
runSchema.virtual('durationHours').get(function () {
  return this.duration / 3600;
});

// Virtual for distance in kilometers
runSchema.virtual('distanceKm').get(function () {
  return this.distance / 1000;
});

// Pre-save middleware to ensure data consistency
runSchema.pre('save', function (next) {
  // Ensure endTime is after startTime
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  }

  // Calculate max speed from route if not provided
  if (this.route && this.route.length > 1 && !this.maxSpeed) {
    let maxSpeed = 0;
    for (let i = 1; i < this.route.length; i++) {
      const prev = this.route[i - 1];
      const curr = this.route[i];
      const timeDiff = (new Date(curr.timestamp) - new Date(prev.timestamp)) / 1000; // seconds

      if (timeDiff > 0) {
        const distance = calculateDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude
        );
        const speed = (distance / timeDiff) * 3.6; // Convert m/s to km/h
        maxSpeed = Math.max(maxSpeed, speed);
      }
    }
    this.maxSpeed = maxSpeed;
  }

  next();
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Static method to get user runs with pagination
runSchema.statics.getUserRuns = function (userId, { page = 1, limit = 10, includeDeleted = false }) {
  const skip = (page - 1) * limit;
  const query = { userId, ...(includeDeleted ? {} : { isDeleted: false }) };

  return this.find(query)
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v');
};

// Static method to get runs in date range
runSchema.statics.getRunsByDateRange = function (userId, startDate, endDate) {
  return this.find({
    userId,
    isDeleted: false,
    startTime: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).sort({ startTime: -1 });
};

const Run = mongoose.model('Run', runSchema);

module.exports = Run;
