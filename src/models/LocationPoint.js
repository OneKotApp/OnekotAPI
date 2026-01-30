const mongoose = require('mongoose');

const locationPointSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: [true, 'Run ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      index: true,
    },
    altitude: {
      type: Number,
      default: null,
    },
    accuracy: {
      type: Number,
      default: null,
      min: [0, 'Accuracy cannot be negative'],
    },
    sequenceOrder: {
      type: Number,
      required: [true, 'Sequence order is required'],
      min: [0, 'Sequence order cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'location_points',
  }
);

// Compound indexes for efficient queries
locationPointSchema.index({ runId: 1, sequenceOrder: 1 });
locationPointSchema.index({ userId: 1, timestamp: -1 });
locationPointSchema.index({ runId: 1, timestamp: 1 });

// Static method to bulk insert location points
locationPointSchema.statics.bulkInsertPoints = async function (runId, userId, points) {
  const locationPoints = points.map((point, index) => ({
    runId,
    userId,
    latitude: point.latitude,
    longitude: point.longitude,
    timestamp: new Date(point.timestamp),
    altitude: point.altitude || null,
    accuracy: point.accuracy || null,
    sequenceOrder: index,
  }));

  return this.insertMany(locationPoints);
};

// Static method to get all points for a run
locationPointSchema.statics.getPointsByRunId = function (runId) {
  return this.find({ runId }).sort({ sequenceOrder: 1 }).select('-__v -_id');
};

const LocationPoint = mongoose.model('LocationPoint', locationPointSchema);

module.exports = LocationPoint;
