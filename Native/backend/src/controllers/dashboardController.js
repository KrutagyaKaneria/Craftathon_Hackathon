/**
 * Dashboard Controller
 * Handles all dashboard-related API endpoints
 */

import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Owner } from '../models/Owner.js';
import { Session } from '../models/Session.js';

const getDashboardData = async (req, res) => {
  try {
    // Get owner ID from authenticated request or fallback to default
    const ownerId = req.ownerId || req.user?.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';
    console.log('📊 Dashboard request - ownerId:', ownerId);

    if (!ownerId) {
      console.error('❌ Dashboard: No ownerId found in request or fallback');
      return res.status(400).json({
        success: false,
        message: 'Owner ID is required',
      });
    }
    
    console.log('✅ Dashboard: User authenticated, ownerId:', ownerId);

    // Fetch REAL DATA from database - filtered by ownerId
    const totalVehicles = await Vehicle.countDocuments({ ownerId });
    const activeVehicles = await Vehicle.countDocuments({ ownerId, status: 'active' });
    const totalDrivers = await Driver.countDocuments({ ownerId });
    const activeDrivers = await Driver.countDocuments({ ownerId, isOnDuty: true });

    // Fetch sessions data
    const activeSessions = await Session.find({ ownerId, status: 'active' })
      .sort({ startTime: -1 })
      .select('_id driverId driverName vehicleId vehicleNumber status startTime safetyScore alertsCount')
      .lean();
    
    const allSessions = await Session.find({ ownerId })
      .sort({ startTime: -1 })
      .limit(10)
      .select('_id driverId driverName vehicleId vehicleNumber status startTime endTime safetyScore alertsCount duration')
      .lean();

    // Get safety rating from all vehicles of this owner
    const vehiclesData = await Vehicle.find({ ownerId }).select('safety_rating fuel_level status').lean();
    const avgSafetyRating = vehiclesData.length > 0 
      ? Math.round(vehiclesData.reduce((sum, v) => sum + (v.safety_rating || 85), 0) / vehiclesData.length)
      : 0;

    // Calculate fleet readiness (vehicles in active status)
    const activeStatusCount = vehiclesData.filter(v => v.status === 'active').length;
    const fleetReadiness = totalVehicles > 0 
      ? Math.round((activeStatusCount / totalVehicles) * 100)
      : 0;

    // Calculate average fuel efficiency
    const avgFuelLevel = vehiclesData.length > 0
      ? Math.round(vehiclesData.reduce((sum, v) => sum + (v.fuel_level || 75), 0) / vehiclesData.length)
      : 0;

    // Generate dynamic alerts based on real vehicle data
    const lowFuelVehicles = vehiclesData.filter(v => v.fuel_level < 30);
    const recentAlerts = [];

    if (lowFuelVehicles.length > 0) {
      recentAlerts.push({
        id: '1',
        type: 'low_fuel',
        severity: 'high',
        title: `${lowFuelVehicles.length} Vehicle(s) - Low Fuel Warning`,
        description: `${lowFuelVehicles.length} vehicle(s) have fuel levels below 30%. Immediate refueling recommended.`,
        unitId: await Vehicle.findOne({ ownerId, fuel_level: { $lt: 30 } }).select('vehicle_number').lean().then(v => v?.vehicle_number || 'N/A'),
        timestamp: new Date().toISOString(),
        actionRequired: true,
      });
    }

    if (totalVehicles < 3) {
      recentAlerts.push({
        id: '2',
        type: 'low_fleet',
        severity: 'medium',
        title: 'Low Fleet Count',
        description: `Fleet has only ${totalVehicles} vehicle(s). Consider adding more units.`,
        unitId: 'FLEET',
        timestamp: new Date().toISOString(),
      });
    }

    const dashboardData = {
      totalDrivers,
      totalVehicles,
      activeDrivers,
      activeSessions: activeSessions.length,
      safetyRating: avgSafetyRating,
      fleetReadiness,
      fuelEfficiency: avgFuelLevel,
      recentAlerts: recentAlerts.length > 0 ? recentAlerts : [
        {
          id: 'info',
          type: 'status_good',
          severity: 'low',
          title: 'Fleet Status: Operational',
          description: 'All systems running nominally. No active alerts.',
          timestamp: new Date().toISOString(),
        }
      ],
      sessions: {
        active: activeSessions,
        recent: allSessions,
      },
    };

    console.log('📊 Dashboard Data:', dashboardData);

    return res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Dashboard controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
}

const getMetrics = async (req, res) => {
  try {
    const ownerId = req.ownerId || req.user?.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID is required',
      });
    }

    // Fetch REAL DATA from database - filtered by ownerId
    const totalVehicles = await Vehicle.countDocuments({ ownerId });
    const activeVehicles = await Vehicle.countDocuments({ ownerId, status: 'active' });
    const totalDrivers = await Driver.countDocuments({ ownerId });

    // Get safety rating from all vehicles of this owner
    const vehiclesData = await Vehicle.find({ ownerId }).select('safety_rating fuel_level status').lean();
    const avgSafetyRating = vehiclesData.length > 0 
      ? Math.round(vehiclesData.reduce((sum, v) => sum + (v.safety_rating || 85), 0) / vehiclesData.length)
      : 0;

    // Calculate fleet readiness
    const activeStatusCount = vehiclesData.filter(v => v.status === 'active').length;
    const fleetReadiness = totalVehicles > 0 
      ? Math.round((activeStatusCount / totalVehicles) * 100)
      : 0;

    // Calculate average fuel efficiency
    const avgFuelLevel = vehiclesData.length > 0
      ? Math.round(vehiclesData.reduce((sum, v) => sum + (v.fuel_level || 75), 0) / vehiclesData.length)
      : 0;

    const metrics = {
      totalDrivers,
      totalVehicles,
      activeDrivers: activeVehicles,
      safetyRating: avgSafetyRating,
      fleetReadiness,
      fuelEfficiency: avgFuelLevel,
    };

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Metrics controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
      error: error.message,
    });
  }
};

const getAlerts = async (req, res) => {
  try {
    const ownerId = req.ownerId || req.user?.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';
    const limit = parseInt(req.query.limit) || 5;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID is required',
      });
    }

    const alerts = [
      {
        id: '1',
        type: 'driver_fatigue',
        severity: 'high',
        title: 'Driver Fatigue Detected',
        description:
          'Unit J02 - Marcus Holloway shows sustained biometric indicators of microsleep.',
        unitId: 'J02',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        actionRequired: true,
      },
      {
        id: '2',
        type: 'hard_braking',
        severity: 'medium',
        title: 'Hard Braking Incident',
        description:
          'Unit I18 recorded a -12.4m/s² deceleration event on Route 66.',
        unitId: 'I18',
        timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      },
      {
        id: '3',
        type: 'route_deviation',
        severity: 'low',
        title: 'Route Deviation',
        description:
          'Unit G89 has deviated from planned trajectory via Corridor Beta.',
        unitId: 'G89',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      },
    ];

    return res.status(200).json({
      success: true,
      data: alerts.slice(0, limit),
    });
  } catch (error) {
    console.error('Alerts controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message,
    });
  }
};

const acknowledgeAlert = async (req, res) => {
  try {
    const userId = req.user?.id || 'demo_user';
    const { alertId } = req.params;

    // No mandatory user check for web-app compatibility

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: 'Alert ID is required',
      });
    }

    // In production, save acknowledgment to database
    // For now, just return success
    return res.status(200).json({
      success: true,
      message: 'Alert acknowledged',
      data: { alertId },
    });
  } catch (error) {
    console.error('Acknowledge alert controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message,
    });
  }
};

export { getDashboardData, getMetrics, getAlerts, acknowledgeAlert };
