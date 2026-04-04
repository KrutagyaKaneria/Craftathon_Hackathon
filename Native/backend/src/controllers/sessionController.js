import { Session } from '../models/Session.js';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { io } from '../utils/socketHandler.js';

/**
 * Session Controller
 * Handles all session-related API endpoints
 */

export const getAllSessions = async (req, res) => {
  try {
    // Get ownerId from authenticated token or query parameter
    let ownerId = req.ownerId || req.user?.ownerId;
    if (req.query.ownerId) {
      // Verify it matches the authenticated owner
      if (req.ownerId && req.query.ownerId !== req.ownerId) {
        console.error(`❌ Owner mismatch - Token owner: ${req.ownerId}, Query owner: ${req.query.ownerId}`);
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Cannot access other owners data',
        });
      }
      ownerId = req.query.ownerId;
    }

    if (!ownerId) {
      console.error('❌ No ownerId provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication required - owner ID not found',
      });
    }

    console.log('📊 Sessions - Getting all sessions');
    console.log('   ownerId:', ownerId);

    // Fetch all sessions for this owner sorted by start time (newest first)
    console.log(`🔍 Querying sessions for ownerId: ${ownerId}`);
    const sessions = await Session.find({ ownerId })
      .sort({ startTime: -1 })
      .lean();

    console.log(`✅ Found ${sessions.length} sessions for this owner`);

    // Calculate stats
    const activeSessions = sessions.filter((s) => s.status === 'active');
    const totalAlerts = sessions.reduce((sum, s) => sum + (s.alertsCount || 0), 0);
    const avgSafetyScore =
      sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.safetyScore, 0) / sessions.length)
        : 0;

    console.log(`📈 Stats - Active: ${activeSessions.length}, Alerts: ${totalAlerts}, Avg Safety: ${avgSafetyScore}`);

    return res.status(200).json({
      success: true,
      data: sessions,
      stats: {
        totalSessions: sessions.length,
        activeSessions: activeSessions.length,
        totalAlerts,
        avgSafetyScore,
      },
    });
  } catch (error) {
    console.error('❌ Get all sessions error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message,
    });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📊 Getting session:', id);

    const session = await Session.findById(id)
      .populate('driverId', 'firstName lastName email phone')
      .populate('vehicleId', 'vehicle_number vehicle_name')
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    console.log('✅ Session found:', session._id);
    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('❌ Get session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch session',
      error: error.message,
    });
  }
};

export const createSession = async (req, res) => {
  try {
    // Get ownerId from authenticated token or query parameter
    let ownerId = req.ownerId || req.user?.ownerId;
    if (req.query.ownerId) {
      // Verify it matches the authenticated owner
      if (req.ownerId && req.query.ownerId !== req.ownerId) {
        console.error(`❌ Owner mismatch - Token owner: ${req.ownerId}, Query owner: ${req.query.ownerId}`);
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Cannot access other owners data',
        });
      }
      ownerId = req.query.ownerId;
    }

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - owner ID not found',
      });
    }

    console.log('Creating session - ownerId:', ownerId);

    let {
      driverId,
      driverName,
      driverPhoto,
      vehicleId,
      vehicleNumber,
      vehicleModel,
      safetyScore,
      alertsCount,
    } = req.body;

    // Validate minimum required fields
    if (!driverId || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'driverId and vehicleId are required',
      });
    }

    // Resolve driver info if missing
    if (!driverName) {
      const driver = await Driver.findById(driverId).lean();
      if (driver) {
        driverName = `${driver.firstName} ${driver.lastName}`.trim();
        driverPhoto = driver.profilePhoto;
      }
    }

    // Resolve vehicle info if missing
    if (!vehicleNumber) {
      const vehicle = await Vehicle.findById(vehicleId).lean();
      if (vehicle) {
        vehicleNumber = vehicle.vehicle_number;
        vehicleModel = vehicle.model || vehicle.vehicle_name;
      }
    }

    // Final validation check for resolved data
    if (!driverName || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Could not resolve driver or vehicle from provided IDs',
      });
    }

    // Create new session
    const newSession = new Session({
      ownerId,
      driverId,
      driverName,
      driverPhoto: driverPhoto || null,
      vehicleId: vehicleId || null,
      vehicleNumber,
      vehicleModel: vehicleModel || 'Unknown',
      status: 'active',
      startTime: new Date(),
      safetyScore: safetyScore || 100,
      alertsCount: alertsCount || 0,
    });

    const savedSession = await newSession.save();
    
    // Update vehicle status to in-use when session starts
    if (vehicleId) {
      await Vehicle.findByIdAndUpdate(
        vehicleId,
        {
          status: 'in-use',
          assigned_driver: driverId,
          in_transit: true,
          last_active: new Date()
        },
        { new: true }
      );
      console.log('🚌 Vehicle assigned to session:', vehicleId);
    }

    // Emit session started event with alert priority
    console.log(`📣 Emitting session_started event for owner: ${ownerId}`);
    io.to(`owner:${ownerId}`).emit('session_started', {
      type: 'session_event',
      event: 'session_started',
      severity: 'low',
      priority: 'low',
      timestamp: new Date().toISOString(),
      session: {
        _id: savedSession._id,
        driverId: savedSession.driverId,
        driverName: savedSession.driverName,
        vehicleId: savedSession.vehicleId,
        vehicleNumber: savedSession.vehicleNumber,
        vehicleModel: savedSession.vehicleModel,
        status: savedSession.status,
        startTime: savedSession.startTime,
        safetyScore: savedSession.safetyScore,
        alertsCount: savedSession.alertsCount,
      },
      message: `Driver ${driverName} started session with vehicle ${vehicleNumber}`,
    });

    console.log('✅ Session created:', savedSession._id);

    return res.status(201).json({
      success: true,
      data: savedSession,
      message: 'Session created successfully',
    });
  } catch (error) {
    console.error('❌ Create session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message,
    });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    // Loosen strict userId check for web-app demo
    // if (!userId) { ... }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Update session fields
    const {
      status,
      safetyScore,
      alertsCount,
      heartRate,
      eyeTracking,
      lastBreak,
      alert,
    } = req.body;

    if (status) session.status = status;
    if (safetyScore !== undefined) session.safetyScore = safetyScore;
    if (alertsCount !== undefined) session.alertsCount = alertsCount;
    if (heartRate !== undefined) session.heartRate = heartRate;
    if (eyeTracking) session.eyeTracking = eyeTracking;
    if (lastBreak) session.lastBreak = lastBreak;
    if (alert) session.alert = alert;

    // If session is being ended, set endTime and release the vehicle
    if (status === 'ended' && !session.endTime) {
      session.endTime = new Date();
      session.duration = Math.round((session.endTime - session.startTime) / (1000 * 60)); // Convert to minutes
      
      // Release the vehicle back to available status
      if (session.vehicleId) {
        await Vehicle.findByIdAndUpdate(
          session.vehicleId,
          {
            status: 'available',
            assigned_driver: null,
            in_transit: false,
            last_active: new Date()
          },
          { new: true }
        );
        console.log('🚌 Vehicle released:', session.vehicleId);
      }
    }

    const updatedSession = await session.save();
    
    // Emit session ended event with alert priority
    if (status === 'ended') {
      console.log(`📣 Emitting session_ended event for owner: ${session.ownerId}`);
      io.to(`owner:${session.ownerId}`).emit('session_ended', {
        type: 'session_event',
        event: 'session_ended',
        severity: 'low',
        priority: 'low',
        timestamp: new Date().toISOString(),
        session: {
          _id: updatedSession._id,
          driverId: updatedSession.driverId,
          driverName: updatedSession.driverName,
          vehicleId: updatedSession.vehicleId,
          vehicleNumber: updatedSession.vehicleNumber,
          vehicleModel: updatedSession.vehicleModel,
          status: updatedSession.status,
          startTime: updatedSession.startTime,
          endTime: updatedSession.endTime,
          duration: updatedSession.duration,
          safetyScore: updatedSession.safetyScore,
          alertsCount: updatedSession.alertsCount,
        },
        message: `Session ended for ${updatedSession.driverName} on vehicle ${updatedSession.vehicleNumber}. Safety Score: ${updatedSession.safetyScore}`,
      });
    }
    
    console.log('✅ Session updated:', updatedSession._id);

    return res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Session updated successfully',
    });
  } catch (error) {
    console.error('❌ Update session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message,
    });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    // Loosen strict userId check for web-app demo
    // if (!userId) { ... }

    const session = await Session.findByIdAndDelete(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Release the vehicle if session had a vehicle assigned
    if (session.vehicleId) {
      await Vehicle.findByIdAndUpdate(
        session.vehicleId,
        {
          status: 'available',
          assigned_driver: null,
          in_transit: false,
          last_active: new Date()
        },
        { new: true }
      );
      console.log('🚌 Vehicle released:', session.vehicleId);
    }

    console.log('✅ Session deleted:', id);

    return res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: error.message,
    });
  }
};

export const getActiveSessions = async (req, res) => {
  try {
    console.log('📊 Getting active sessions');

    const activeSessions = await Session.find({ status: 'active' })
      .sort({ startTime: -1 })
      .lean();

    console.log(`✅ Found ${activeSessions.length} active sessions`);

    return res.status(200).json({
      success: true,
      data: activeSessions,
      count: activeSessions.length,
    });
  } catch (error) {
    console.error('❌ Get active sessions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions',
      error: error.message,
    });
  }
};

export const updateSessionTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      distance,
      maxAcceleration,
      maxDeceleration,
      avgSpeed,
      maxSpeed,
      telemetrySnapshot
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Update telemetry metrics
    if (distance !== undefined) session.distanceCovered = distance;
    if (maxAcceleration !== undefined) session.maxAcceleration = maxAcceleration;
    if (maxDeceleration !== undefined) session.maxDeceleration = maxDeceleration;
    if (avgSpeed !== undefined) session.avgSpeed = avgSpeed;
    if (maxSpeed !== undefined) session.maxSpeed = maxSpeed;

    // Add telemetry snapshot for real-time tracking
    if (telemetrySnapshot) {
      session.telemetrySnapshots.push({
        timestamp: new Date(),
        ...telemetrySnapshot,
      });
      // Keep only last 1000 snapshots
      if (session.telemetrySnapshots.length > 1000) {
        session.telemetrySnapshots = session.telemetrySnapshots.slice(-1000);
      }
    }

    const updatedSession = await session.save();
    console.log(`📊 Session telemetry updated: ${id}`);

    return res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Telemetry updated successfully',
    });
  } catch (error) {
    console.error('❌ Update telemetry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update telemetry',
      error: error.message,
    });
  }
};
