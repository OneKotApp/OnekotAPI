const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    periodType: {
      type: String,
      required: [true, 'Period type is required'],
      enum: {
        values: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'],
        message: 'Period type must be one of: daily, weekly, monthly, yearly, all_time',
      },
      index: true,
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required'],
    },
    totalDistance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total distance cannot be negative'],
    },
    totalDuration: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total duration cannot be negative'],
    },
    totalRuns: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total runs cannot be negative'],
    },
    averageSpeed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Average speed cannot be negative'],
    },
    longestRun: {
      type: Number,
      default: 0,
      min: [0, 'Longest run cannot be negative'],
    },
    longestDuration: {
      type: Number,
      default: 0,
      min: [0, 'Longest duration cannot be negative'],
    },
    fastestSpeed: {
      type: Number,
      default: 0,
      min: [0, 'Fastest speed cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'stats',
  }
);

// Compound unique index to prevent duplicate stats for same period
statsSchema.index({ userId: 1, periodType: 1, periodStart: 1 }, { unique: true });
statsSchema.index({ userId: 1, periodType: 1 });
statsSchema.index({ periodStart: -1 });

// Virtual for total distance in kilometers
statsSchema.virtual('totalDistanceKm').get(function () {
  return this.totalDistance / 1000;
});

// Virtual for total duration in hours
statsSchema.virtual('totalDurationHours').get(function () {
  return this.totalDuration / 3600;
});

// Static method to update or create stats
statsSchema.statics.updateOrCreateStats = async function (
  userId,
  periodType,
  periodStart,
  periodEnd,
  statsData
) {
  const query = { userId, periodType, periodStart };

  const update = {
    $set: {
      periodEnd,
      totalDistance: statsData.totalDistance,
      totalDuration: statsData.totalDuration,
      totalRuns: statsData.totalRuns,
      averageSpeed: statsData.averageSpeed,
      longestRun: statsData.longestRun,
      longestDuration: statsData.longestDuration,
      fastestSpeed: statsData.fastestSpeed,
    },
  };

  return this.findOneAndUpdate(query, update, {
    new: true,
    upsert: true,
    runValidators: true,
  });
};

// Static method to get stats by period type
statsSchema.statics.getStatsByPeriod = function (userId, periodType) {
  return this.find({ userId, periodType }).sort({ periodStart: -1 });
};

// Static method to get all-time stats
statsSchema.statics.getAllTimeStats = function (userId) {
  return this.findOne({ userId, periodType: 'all_time' });
};

const Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;
