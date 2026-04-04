import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Owner',
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    driverPhoto: {
      type: String, // URL or base64
      default: null,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    vehicleModel: {
      type: String,
      default: 'Unknown',
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      // Duration in minutes
      type: Number,
      default: 0,
    },
    // Distance and telemetry metrics
    distanceCovered: {
      type: Number,
      default: 0, // in kilometers
    },
    maxAcceleration: {
      type: Number,
      default: 0, // in m/s²
    },
    maxDeceleration: {
      type: Number,
      default: 0, // in m/s²
    },
    avgSpeed: {
      type: Number,
      default: 0, // in km/h
    },
    maxSpeed: {
      type: Number,
      default: 0, // in km/h
    },
    // Telemetry array for real-time updates
    telemetrySnapshots: {
      type: [
        {
          timestamp: Date,
          distance: Number,
          speed: Number,
          acceleration: Number,
          brake: Number,
          steering: Number,
        },
      ],
      default: [],
    },
    safetyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    alertsCount: {
      type: Number,
      default: 0,
    },
    heartRate: {
      type: Number,
      default: null,
    },
    eyeTracking: {
      type: String, // 'Focused', 'Unfocused', 'Closed'
      default: null,
    },
    lastBreak: {
      type: String, // e.g., "4h 12m ago"
      default: null,
    },
    alert: {
      type: mongoose.Schema.Types.Mixed, // Flexible object: {type, level, severity}
      default: null,
    },
    telemetryData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Session = mongoose.model('Session', SessionSchema);
