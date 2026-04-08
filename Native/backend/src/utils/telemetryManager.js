import { Telemetry } from '../models/Telemetry.js';
import { Session } from '../models/Session.js';

/**
 * Telemetry Utility Functions
 * Handles separate telemetry collection operations instead of embedded arrays
 */

/**
 * Add a telemetry snapshot to the new collection
 * @param {Object} telemetryData - Telemetry snapshot with metrics
 * @returns {Promise<Object>} Created telemetry document
 */
export async function addTelemetrySnapshot(telemetryData) {
  try {
    const {
      sessionId,
      driverId,
      vehicleId,
      distance,
      speed,
      acceleration,
      brake,
      steering,
      latitude,
      longitude,
      altitude,
      engineRPM,
      fuelLevel,
      odometerReading,
    } = telemetryData;

    const telemetry = new Telemetry({
      sessionId,
      driverId,
      vehicleId,
      timestamp: new Date(),
      distance,
      speed,
      acceleration,
      brake,
      steering,
      latitude,
      longitude,
      altitude,
      engineRPM,
      fuelLevel,
      odometerReading,
    });

    await telemetry.save();
    return telemetry;
  } catch (error) {
    console.error('❌ Error adding telemetry snapshot:', error);
    throw error;
  }
}

/**
 * Get telemetry snapshots for a session
 * @param {string} sessionId - Session ObjectId
 * @param {Object} options - Query options
 * @param {number} options.limit - Max results (default: 100)
 * @param {number} options.skip - Skip N results (default: 0)
 * @param {Date} options.startTime - Filter from this time
 * @param {Date} options.endTime - Filter until this time
 * @returns {Promise<Array>} Telemetry snapshots
 */
export async function getSessionTelemetry(sessionId, options = {}) {
  try {
    const { limit = 100, skip = 0, startTime, endTime } = options;

    const query = { sessionId };

    // Add time range filter if provided
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = startTime;
      if (endTime) query.timestamp.$lte = endTime;
    }

    const telemetry = await Telemetry.find(query)
      .sort({ timestamp: 1 }) // Oldest first
      .limit(limit)
      .skip(skip)
      .lean(); // Return plain objects, not hydrated documents

    return telemetry;
  } catch (error) {
    console.error('❌ Error fetching session telemetry:', error);
    throw error;
  }
}

/**
 * Get telemetry count for a session
 * @param {string} sessionId - Session ObjectId
 * @returns {Promise<number>} Count of telemetry documents
 */
export async function getSessionTelemetryCount(sessionId) {
  try {
    const count = await Telemetry.countDocuments({ sessionId });
    return count;
  } catch (error) {
    console.error('❌ Error counting telemetry:', error);
    throw error;
  }
}

/**
 * Delete telemetry for a session
 * @param {string} sessionId - Session ObjectId
 * @returns {Promise<Object>} Delete result
 */
export async function deleteSessionTelemetry(sessionId) {
  try {
    const result = await Telemetry.deleteMany({ sessionId });
    console.log(`🗑️  Deleted ${result.deletedCount} telemetry records for session ${sessionId}`);
    return result;
  } catch (error) {
    console.error('❌ Error deleting telemetry:', error);
    throw error;
  }
}

/**
 * Get aggregate statistics for a session
 * @param {string} sessionId - Session ObjectId
 * @returns {Promise<Object>} Statistics (max speed, avg speed, etc.)
 */
export async function getSessionTelemetryStats(sessionId) {
  try {
    const stats = await Telemetry.aggregate([
      {
        $match: { sessionId: new (require('mongoose')).Types.ObjectId(sessionId) },
      },
      {
        $group: {
          _id: '$sessionId',
          maxSpeed: { $max: '$speed' },
          avgSpeed: { $avg: '$speed' },
          maxAcceleration: { $max: '$acceleration' },
          minAcceleration: { $min: '$acceleration' },
          maxDeceleration: { $max: '$brake' },
          totalDistance: { $sum: '$distance' },
          recordCount: { $sum: 1 },
        },
      },
    ]);

    return stats.length > 0
      ? stats[0]
      : {
          maxSpeed: 0,
          avgSpeed: 0,
          maxAcceleration: 0,
          minAcceleration: 0,
          maxDeceleration: 0,
          totalDistance: 0,
          recordCount: 0,
        };
  } catch (error) {
    console.error('❌ Error getting telemetry stats:', error);
    throw error;
  }
}

/**
 * Clean up old telemetry data manually (MongoDB TTL will also run automatically)
 * @param {number} daysOld - Delete telemetry older than this many days
 * @returns {Promise<Object>} Delete result
 */
export async function cleanupOldTelemetry(daysOld = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Telemetry.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`🧹 Telemetry cleanup: Deleted ${result.deletedCount} records older than ${daysOld} days`);
    return result;
  } catch (error) {
    console.error('❌ Error cleaning telemetry:', error);
    throw error;
  }
}

/**
 * Get last N telemetry snapshots for real-time dashboard
 * @param {string} sessionId - Session ObjectId
 * @param {number} limit - Number of latest snapshots
 * @returns {Promise<Array>} Latest telemetry snapshots
 */
export async function getLatestTelemetry(sessionId, limit = 50) {
  try {
    const telemetry = await Telemetry.find({ sessionId })
      .sort({ timestamp: -1 }) // Newest first
      .limit(limit)
      .lean();

    return telemetry.reverse(); // Return in chronological order
  } catch (error) {
    console.error('❌ Error fetching latest telemetry:', error);
    throw error;
  }
}

/**
 * Export telemetry as CSV for analysis
 * @param {string} sessionId - Session ObjectId
 * @returns {Promise<string>} CSV formatted data
 */
export async function exportTelemetryAsCSV(sessionId) {
  try {
    const telemetry = await Telemetry.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (telemetry.length === 0) {
      return 'No telemetry data found';
    }

    // Build CSV header
    const headers = [
      'Timestamp',
      'Speed (km/h)',
      'Acceleration (m/s²)',
      'Brake',
      'Steering',
      'Distance (km)',
      'Latitude',
      'Longitude',
      'Engine RPM',
      'Fuel Level',
    ];

    // Build CSV rows
    const rows = telemetry.map((t) => [
      new Date(t.timestamp).toISOString(),
      t.speed || '',
      t.acceleration || '',
      t.brake || '',
      t.steering || '',
      t.distance || '',
      t.latitude || '',
      t.longitude || '',
      t.engineRPM || '',
      t.fuelLevel || '',
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('❌ Error exporting telemetry:', error);
    throw error;
  }
}
