const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    loginTime: {
      type: Date,
      required: [true, 'Login time is required'],
      default: Date.now,
      index: true,
    },
    deviceInfo: {
      deviceName: {
        type: String,
        default: 'Unknown Device',
      },
      deviceModel: {
        type: String,
        default: null,
      },
      osName: {
        type: String,
        default: null,
      },
      osVersion: {
        type: String,
        default: null,
      },
      appVersion: {
        type: String,
        default: null,
      },
    },
    location: {
      latitude: {
        type: Number,
        default: null,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        default: null,
        min: -180,
        max: 180,
      },
      city: {
        type: String,
        default: null,
      },
      country: {
        type: String,
        default: null,
      },
      ipAddress: {
        type: String,
        default: null,
      },
    },
    userAgent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
  },
  {
    timestamps: true,
    collection: 'login_activity',
  }
);

// Indexes for performance
loginActivitySchema.index({ userId: 1, loginTime: -1 });
loginActivitySchema.index({ email: 1, loginTime: -1 });
loginActivitySchema.index({ loginTime: -1 });
loginActivitySchema.index({ status: 1 });

// Static method to log login activity
loginActivitySchema.statics.logActivity = async function (activityData) {
  return this.create({
    userId: activityData.userId,
    email: activityData.email,
    loginTime: new Date(),
    deviceInfo: activityData.deviceInfo || {},
    location: activityData.location || {},
    userAgent: activityData.userAgent || null,
    status: activityData.status || 'success',
  });
};

// Static method to get user's login history
loginActivitySchema.statics.getUserLoginHistory = function (userId, { page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;

  return this.find({ userId })
    .sort({ loginTime: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v');
};

// Static method to get recent login activity across all users
loginActivitySchema.statics.getRecentActivity = function ({ page = 1, limit = 50 }) {
  const skip = (page - 1) * limit;

  return this.find()
    .sort({ loginTime: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'email username')
    .select('-__v');
};

const LoginActivity = mongoose.model('LoginActivity', loginActivitySchema);

module.exports = LoginActivity;
