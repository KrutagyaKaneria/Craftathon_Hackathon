import { Alert } from '../models/Alert.js';

/**
 * Alert Controller
 * Handles alert-related API endpoints
 */

export const getAllAlerts = async (req, res) => {
  try {
    // Get ownerId from authenticated token only
    let ownerId = req.ownerId;
    
    // If query parameter provided, verify it matches the authenticated owner
    if (req.query.ownerId) {
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
      console.error('❌ No ownerId found in authenticated token');
      return res.status(401).json({
        success: false,
        message: 'Authentication required - owner ID not found',
      });
    }

    console.log('📊 Getting all alerts for owner:', ownerId);

    const alerts = await Alert.find({ ownerId })
      .populate('driverId', 'firstName lastName')
      .populate('vehicleId', 'vehicle_number vehicle_name')
      .sort({ timestamp: -1 })
      .lean();

    console.log(`✅ Found ${alerts.length} alerts for owner`);

    // Calculate stats
    const highRiskAlerts = alerts.filter((a) => a.severity === 'high' && !a.resolved);
    const mediumRiskAlerts = alerts.filter((a) => a.severity === 'medium' && !a.resolved);
    const resolvedAlerts = alerts.filter((a) => a.resolved);

    return res.status(200).json({
      success: true,
      data: alerts,
      stats: {
        total: alerts.length,
        highRisk: highRiskAlerts.length,
        mediumRisk: mediumRiskAlerts.length,
        resolved: resolvedAlerts.length,
      },
    });
  } catch (error) {
    console.error('❌ Get all alerts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message,
    });
  }
};

export const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📊 Getting alert by ID:', id);

    const alert = await Alert.findById(id)
      .populate('driverId', 'firstName lastName email phone')
      .populate('vehicleId', 'vehicle_number vehicle_name')
      .lean();

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    console.log('✅ Alert found:', alert._id);
    return res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('❌ Get alert error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch alert',
      error: error.message,
    });
  }
};

export const createAlert = async (req, res) => {
  try {
    const {
      ownerId,
      driverId,
      vehicleId,
      sessionId,
      driverName,
      vehicleNumber,
      vehicleModel,
      eventType,
      subtype,
      severity,
      telemetryData,
      driverPhoto,
    } = req.body;

    console.log('📝 Creating new alert:', { eventType, severity, driverName });

    const alert = new Alert({
      ownerId: ownerId || req.user?.ownerId || req.ownerId,
      driverId,
      vehicleId,
      sessionId,
      driverName,
      vehicleNumber,
      vehicleModel,
      eventType,
      subtype,
      severity,
      telemetryData,
      driverPhoto,
    });

    await alert.save();
    console.log('✅ Alert created:', alert._id);

    return res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully',
    });
  } catch (error) {
    console.error('❌ Create alert error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error.message,
    });
  }
};

export const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      severity,
      subtype,
      resolved,
      resolvedAt,
      resolvedBy,
      notes,
      dismissedAt,
    } = req.body;

    console.log('🔄 Updating alert:', id);

    const alert = await Alert.findByIdAndUpdate(
      id,
      {
        severity: severity !== undefined ? severity : undefined,
        subtype: subtype !== undefined ? subtype : undefined,
        resolved: resolved !== undefined ? resolved : undefined,
        resolvedAt: resolved ? resolvedAt || new Date() : undefined,
        resolvedBy: resolved ? resolvedBy : undefined,
        notes,
        dismissedAt,
      },
      { new: true, runValidators: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    console.log('✅ Alert updated:', alert._id);
    return res.status(200).json({
      success: true,
      data: alert,
      message: 'Alert updated successfully',
    });
  } catch (error) {
    console.error('❌ Update alert error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update alert',
      error: error.message,
    });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting alert:', id);

    const alert = await Alert.findByIdAndDelete(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    console.log('✅ Alert deleted:', alert._id);
    return res.status(200).json({
      success: true,
      message: 'Alert deleted successfully',
      data: alert,
    });
  } catch (error) {
    console.error('❌ Delete alert error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: error.message,
    });
  }
};

export const markAsResolved = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedBy, notes } = req.body;

    console.log('✔️ Marking alert as resolved:', id);

    const alert = await Alert.findByIdAndUpdate(
      id,
      {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: resolvedBy || req.user?.id,
        notes,
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    console.log('✅ Alert marked as resolved:', alert._id);
    return res.status(200).json({
      success: true,
      data: alert,
      message: 'Alert marked as resolved',
    });
  } catch (error) {
    console.error('❌ Mark as resolved error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark alert as resolved',
      error: error.message,
    });
  }
};

export const getHighRiskAlerts = async (req, res) => {
  try {
    const ownerId = req.query.ownerId || req.body.ownerId || req.user?.ownerId || req.ownerId;
    console.log('🔴 Getting high-risk alerts for owner:', ownerId);

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID required',
      });
    }

    const alerts = await Alert.find({
      ownerId,
      severity: 'high',
      resolved: false,
    })
      .populate('driverId', 'firstName lastName')
      .populate('vehicleId', 'vehicle_number vehicle_name')
      .sort({ timestamp: -1 })
      .lean();

    console.log(`✅ Found ${alerts.length} high-risk alerts`);

    return res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('❌ Get high-risk alerts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch high-risk alerts',
      error: error.message,
    });
  }
};

export default {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  markAsResolved,
  getHighRiskAlerts,
};
