import mongoose from 'mongoose';

/**
 * Telemetry Schema - Stores individual telemetry snapshots
 * One document per telemetry reading, linked to a session via sessionId
 * Prevents Session document bloat and enables efficient querying
 */

const TelemetrySchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true, // Index for fast queries by session
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true, // Index for per-driver analytics
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true, // Index for per-vehicle diagnostics
    },
    timestamp: {
      type: Date,
      required: true,
      index: true, // Index for time-range queries
    },
    // Core telemetry metrics
    distance: {
      type: Number,
      default: 0, // in km
    },
    speed: {
      type: Number,
      default: 0, // in km/h
    },
    acceleration: {
      type: Number,
      default: 0, // in m/s²
    },
    brake: {
      type: Number,
      default: 0, // brake pressure/force
    },
    steering: {
      type: Number,
      default: 0, // steering angle
    },
    // Optional GPS and environmental data
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    altitude: {
      type: Number,
      default: null,
    },
    // Engine and vehicle diagnostics
    engineRPM: {
      type: Number,
      default: null,
    },
    fuelLevel: {
      type: Number,
      default: null,
    },
    odometerReading: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Compound index for efficient session-time range queries
TelemetrySchema.index({ sessionId: 1, timestamp: 1 });

// TTL index: Auto-delete telemetry older than 90 days
TelemetrySchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 7776000, // 90 days
    sparse: true 
  }
);

export const Telemetry = mongoose.model('Telemetry', TelemetrySchema);
