const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    username: {
      type: String,
      trim: true,
      maxlength: [50, 'Username cannot exceed 50 characters'],
    },
    profilePicture: {
      type: String,
      default: null,
    },
    runColor: {
      type: String,
      default: '#FF6B6B',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color code'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    metadata: {
      totalRuns: {
        type: Number,
        default: 0,
      },
      totalDistance: {
        type: Number,
        default: 0,
      },
      totalDuration: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });

// Instance method to update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLoginAt = new Date();
  await this.save();
};

// Instance method to update metadata
userSchema.methods.updateMetadata = async function (runData) {
  this.metadata.totalRuns += 1;
  this.metadata.totalDistance += runData.distance || 0;
  this.metadata.totalDuration += runData.duration || 0;
  await this.save();
};

// Static method to find active user by email
userSchema.statics.findActiveByEmail = function (email) {
  return this.findOne({ email, isActive: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
