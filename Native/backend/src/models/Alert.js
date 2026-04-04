import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
    },
    driverName: String,
    vehicleNumber: String,
    vehicleModel: String,
    eventType: {
      type: String,
      enum: ['eye_closure', 'rash_driving', 'fatigue', 'speed_violation', 'other'],
      default: 'other',
    },
    subtype: String, // e.g., "Eyes Closed for 3 seconds"
    severity: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    telemetryData: mongoose.Schema.Types.Mixed,
    driverPhoto: String,
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    resolvedBy: String,
    notes: String,
    dismissedAt: Date,
  },
  { timestamps: true }
);

// Index for efficient queries
alertSchema.index({ ownerId: 1, timestamp: -1 });
alertSchema.index({ severity: 1, resolved: 1 });
alertSchema.index({ driverId: 1, timestamp: -1 });

export const Alert = mongoose.model('Alert', alertSchema);
