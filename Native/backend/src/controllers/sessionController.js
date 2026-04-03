import { Session } from '../models/Session.js';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';

/**
 * Session Controller
 * Handles all session-related API endpoints
 */

export const getAllSessions = async (req, res) => {
  try {
    const ownerId = req.ownerId || req.user?.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';
    console.log('Sessions - Getting all sessions - ownerId:', ownerId);

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID required',
      });
    }

    // Fetch all sessions for this owner sorted by start time (newest first)
    const sessions = await Session.find({ ownerId })
      .sort({ startTime: -1 })
      .lean();

    console.log(`Found ${sessions.length} sessions`);

    // Calculate stats
    const activeSessions = sessions.filter((s) => s.status === 'active');
    const totalAlerts = sessions.reduce((sum, s) => sum + (s.alertsCount || 0), 0);
    const avgSafetyScore =
      sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.safetyScore, 0) / sessions.length)
        : 0;

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
    console.error('Get all sessions error:', error);
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
    const ownerId = req.ownerId || req.user?.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';
    console.log('Creating session - ownerId:', ownerId);

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID required',
      });
    }

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

    // If session is being ended, set endTime
    if (status === 'ended' && !session.endTime) {
      session.endTime = new Date();
      session.duration = Math.round((session.endTime - session.startTime) / (1000 * 60)); // Convert to minutes
    }

    const updatedSession = await session.save();
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
