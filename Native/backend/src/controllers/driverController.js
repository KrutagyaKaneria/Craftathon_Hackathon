import { Driver } from '../models/Driver.js';
import { Owner } from '../models/Owner.js';
import { Session } from '../models/Session.js';
import { Alert } from '../models/Alert.js';

/**
 * Driver Controller
 * Handles all driver-related API endpoints
 */

export const getAllDrivers = async (req, res) => {
  try {
    // Check if this is a public request (no auth) or authenticated request
    const isAuthenticated = !!req.ownerId;
    const isPublicRoute = req.path === '/public/all' || req.baseUrl?.includes('/public/all');

    let ownerId = req.ownerId; // From JWT token (if authenticated)
    
    // If authenticated AND query parameter provided, verify ownership
    if (isAuthenticated && req.query.ownerId) {
      if (req.ownerId && req.query.ownerId !== req.ownerId) {
        console.error(`❌ Owner mismatch - Token owner: ${req.ownerId}, Query owner: ${req.query.ownerId}`);
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Cannot access other owners data',
        });
      }
      ownerId = req.query.ownerId;
    }

    // PUBLIC ROUTE: Return ALL drivers from database (no auth required)
    if (isPublicRoute || !isAuthenticated) {
      console.log('📥 PUBLIC REQUEST: Fetching ALL drivers from database (no owner filter)');
      
      const allDrivers = await Driver.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();

      console.log(`✅ Loaded ${allDrivers.length} drivers total from database`);
      allDrivers.slice(0, 3).forEach((driver, index) => {
        console.log(`  [${index + 1}] ${driver.firstName} ${driver.lastName || ''} (Owner: ${driver.ownerId})`);
      });

      return res.status(200).json({
        success: true,
        data: allDrivers,
        count: allDrivers.length,
        message: 'All drivers (public access - no authentication required)'
      });
    }

    // AUTHENTICATED ROUTE: Return ONLY owner's drivers
    if (!ownerId) {
      console.error('❌ No owner ID found in authentication token');
      return res.status(401).json({
        success: false,
        message: 'Authentication required - owner ID not found',
      });
    }

    console.log('🔐 AUTHENTICATED REQUEST: Fetching drivers for owner:', ownerId);

    // Fetch ONLY drivers belonging to the authenticated owner
    const ownerDrivers = await Driver.find({ ownerId })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Loaded ${ownerDrivers.length} drivers for owner ${ownerId}`);
    ownerDrivers.forEach((driver, index) => {
      console.log(`  [${index + 1}] ${driver.firstName} ${driver.lastName || ''} (${driver.email})`);
    });

    return res.status(200).json({
      success: true,
      data: ownerDrivers,
      count: ownerDrivers.length,
      ownerId: ownerId,
      message: 'Drivers for authenticated owner (authentication required)'
    });
  } catch (error) {
    console.error('❌ Get all drivers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers',
      error: error.message,
    });
  }
};

/**
 * GET /api/drivers/owner/me
 * Fetch ONLY drivers for logged-in owner (Native App)
 * Requires authentication - filters by ownerId from JWT token
 */
export const getOwnerDrivers = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    console.log('👤 Fetching drivers for owner:', ownerId);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Owner ID is required - not authenticated',
      });
    }

    // Fetch ONLY drivers belonging to this owner
    const drivers = await Driver.find({ ownerId })
      .select('-password')
      .sort({ createdAt: -1 })
      .populate('ownerId', 'email firstName lastName phone')
      .lean();

    console.log(`✅ Loaded ${drivers.length} drivers for owner ${ownerId}`);
    drivers.forEach((driver, index) => {
      console.log(`  [${index + 1}] ${driver.firstName} ${driver.lastName || ''} (${driver.email})`);
    });

    return res.status(200).json({
      success: true,
      data: drivers,
      count: drivers.length,
      ownerId: ownerId
    });
  } catch (error) {
    console.error('❌ Get owner drivers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch owner drivers',
      error: error.message,
    });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.ownerId || req.query.ownerId;
    console.log('👤 Getting driver:', id);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no owner ID found',
      });
    }

    const driver = await Driver.findById(id)
      .select('-password')
      .lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    // Verify driver belongs to this owner with proper string comparison
    const driverOwnerIdStr = driver.ownerId.toString();
    const requestOwnerIdStr = typeof ownerId === 'object' ? ownerId.toString() : ownerId;
    
    if (driverOwnerIdStr !== requestOwnerIdStr) {
      console.error(`❌ Owner mismatch for driver ${id} - Driver owner: ${driverOwnerIdStr}, Request owner: ${requestOwnerIdStr}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this driver',
      });
    }

    console.log('✅ Driver found:', driver.email);
    return res.status(200).json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error('❌ Get driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch driver',
      error: error.message,
    });
  }
};

export const createDriver = async (req, res) => {
  try {
    const ownerId = req.ownerId || req.body.ownerId || '69cfd750239cb96c7844acb5';
    console.log('👤 Creating driver - ownerId:', ownerId);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Owner ID is required',
      });
    }

    const { firstName, lastName, email, phone, password, profilePhoto } = req.body;

    console.log('📋 Received Data:', {
      firstName,
      lastName,
      email,
      phone,
      password: password ? '***' : 'null',
      profilePhotoReceived: !!profilePhoto,
      profilePhotoType: typeof profilePhoto,
      profilePhotoLength: profilePhoto ? profilePhoto.length : 0,
      profilePhotoSize: profilePhoto ? `${(profilePhoto.length / 1024 / 1024).toFixed(2)}MB` : 'null',
    });

    // Validate required fields
    if (!firstName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'firstName, email, and password are required',
      });
    }

    if (!profilePhoto) {
      console.warn('⚠️ Warning: No profile photo received in request body');
    }

    // Check if driver already exists for this owner
    const existingDriver = await Driver.findOne({ ownerId, email });
    if (existingDriver) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered for this owner',
      });
    }

    // Create new driver
    const newDriver = new Driver({
      ownerId,
      firstName,
      lastName: lastName || '',
      email,
      phone: phone || '',
      password,
      profilePhoto: profilePhoto && profilePhoto.length > 0 ? profilePhoto : null,
      isActive: true,
    });

    console.log('💾 Before Save - profilePhoto:', {
      hasPhoto: !!newDriver.profilePhoto,
      photoLength: newDriver.profilePhoto ? newDriver.profilePhoto.length : 0,
    });

    const savedDriver = await newDriver.save();
    console.log('✅ Driver created:', savedDriver._id);
    console.log('📸 After Save - profilePhoto:', {
      hasPhoto: !!savedDriver.profilePhoto,
      photoLength: savedDriver.profilePhoto ? savedDriver.profilePhoto.length : 0,
      photoSize: savedDriver.profilePhoto ? `${(savedDriver.profilePhoto.length / 1024 / 1024).toFixed(2)}MB` : 'null',
    });

    // Increment owner's totalDrivers count
    await Owner.findByIdAndUpdate(ownerId, { $inc: { totalDrivers: 1 } });

    // Return without password, WITH profilePhoto
    const driverData = savedDriver.toObject();
    delete driverData.password;

    console.log('📤 Response Data - profilePhoto exists:', !!driverData.profilePhoto);

    return res.status(201).json({
      success: true,
      data: driverData,
      message: 'Driver created successfully'
    });
  } catch (error) {
    console.error('❌ Create driver error:', error);
    console.error('Error stack:', error.stack);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create driver',
      error: error.message,
    });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.ownerId || req.query.ownerId;

    console.log('📝 Updating driver:', id);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no owner ID found',
      });
    }

    // Verify driver belongs to this owner
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const driverOwnerIdStr = driver.ownerId.toString();
    const requestOwnerIdStr = typeof ownerId === 'object' ? ownerId.toString() : ownerId;
    
    if (driverOwnerIdStr !== requestOwnerIdStr) {
      console.error(`❌ Owner mismatch for driver ${id} - Driver owner: ${driverOwnerIdStr}, Request owner: ${requestOwnerIdStr}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this driver',
      });
    }

    // Don't allow password or ownerId update via this endpoint
    delete req.body.password;
    delete req.body.ownerId;

    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
      .select('-password');

    console.log('✅ Driver updated:', id);

    return res.status(200).json({
      success: true,
      data: updatedDriver,
      message: 'Driver updated successfully'
    });
  } catch (error) {
    console.error('❌ Update driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update driver',
      error: error.message,
    });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.ownerId || req.query.ownerId;

    console.log('🗑️ Deleting driver:', id);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no owner ID found',
      });
    }

    // Verify driver belongs to this owner
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const driverOwnerIdStr = driver.ownerId.toString();
    const requestOwnerIdStr = typeof ownerId === 'object' ? ownerId.toString() : ownerId;
    
    if (driverOwnerIdStr !== requestOwnerIdStr) {
      console.error(`❌ Owner mismatch for driver ${id} - Driver owner: ${driverOwnerIdStr}, Request owner: ${requestOwnerIdStr}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this driver',
      });
    }

    await Driver.findByIdAndDelete(id);

    // Decrement owner's totalDrivers count
    await Owner.findByIdAndUpdate(ownerId, { $inc: { totalDrivers: -1 } });

    console.log('✅ Driver deleted:', id);

    return res.status(200).json({
      success: true,
      data: driver,
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete driver',
      error: error.message,
    });
  }
};

/**
 * GET /api/drivers/:id/analytics
 * Fetch driver analytics aggregated from all their sessions
 * Returns: safety score, duty hours, alerts, performance rating, etc.
 */
export const getDriverAnalytics = async (req, res) => {
  try {
    const { id: driverId } = req.params;
    // Prioritize req.ownerId from authenticated token, then check query params
    const ownerId = req.ownerId || req.query.ownerId;
    
    console.log('📊 Fetching analytics for driver:', driverId);
    console.log('🔐 Owner ID from token:', req.ownerId);
    console.log('🔐 Owner ID from query:', req.query.ownerId);
    console.log('🔐 Final Owner ID being used:', ownerId);

    // Verify owner ID is provided
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no owner ID found',
      });
    }

    // Verify driver exists and belongs to owner
    const driver = await Driver.findById(driverId).select('-password');
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    // Ensure proper string comparison for ObjectId comparison
    const driverOwnerIdStr = driver.ownerId.toString();
    const requestOwnerIdStr = typeof ownerId === 'object' ? ownerId.toString() : ownerId;
    
    console.log('✔️ Driver Owner ID:', driverOwnerIdStr);
    console.log('✔️ Request Owner ID:', requestOwnerIdStr);

    if (driverOwnerIdStr !== requestOwnerIdStr) {
      console.error(`❌ Owner mismatch - Driver owner: ${driverOwnerIdStr}, Request owner: ${requestOwnerIdStr}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this driver',
      });
    }

    // Fetch all sessions for this driver
    const sessions = await Session.find({ driverId }).sort({ startTime: -1 }).lean();

    // Get all alerts for this driver to calculate dynamic safety score (used for all cases)
    const alerts = await Alert.find({ driverId }).lean();
    const highSeverityAlertCount = alerts.filter(a => a.severity === 'high').length;
    const mediumSeverityAlertCount = alerts.filter(a => a.severity === 'medium').length;
    const lowSeverityAlertCount = alerts.filter(a => a.severity === 'low').length;

    // Calculate safety score based on alerts (same formula as frontend)
    // High severity: -15 points, Medium: -8 points, Low: -3 points
    const calculatedSafetyScore = Math.max(0, Math.min(100, 
      100 - (highSeverityAlertCount * 15) - (mediumSeverityAlertCount * 8) - (lowSeverityAlertCount * 3)
    ));

    console.log(`📊 Safety Score Calculation for ${driverId}:`);
    console.log(`   High: ${highSeverityAlertCount} (-15 ea), Medium: ${mediumSeverityAlertCount} (-8 ea), Low: ${lowSeverityAlertCount} (-3 ea)`);
    console.log(`   Calculated Safety Score: ${calculatedSafetyScore}%`);

    if (sessions.length === 0) {
      console.log('ℹ️ No sessions found for driver:', driverId);
      return res.status(200).json({
        success: true,
        data: {
          driverId,
          driverName: `${driver.firstName} ${driver.lastName}`,
          totalSessions: 0,
          averageSafetyScore: calculatedSafetyScore,
          totalDutyHours: 0,
          totalDutyMinutes: 0,
          totalDistanceCovered: 0,
          totalAlerts: alerts.length,
          perfectPerformanceSessions: 0,
          performanceRating: (calculatedSafetyScore / 100 * 5).toFixed(1),
          recentPerformance: [],
          safetyTrend: [],
          lastSessionDate: null,
        }
      });
    }

    // Calculate analytics
    let totalSafetyScore = 0;
    let totalDutyMinutes = 0;
    let totalAlerts = 0;
    let totalDistance = 0;
    let perfectPerformanceSessions = 0;
    const recentPerformance = [];
    const safetyTrend = [];

    // Get last 7 days for trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    sessions.forEach((session) => {
      // Use calculated safety score for recent sessions
      totalSafetyScore += calculatedSafetyScore;

      // Calculate duty time
      if (session.startTime && session.endTime) {
        const duration = (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60); // convert to minutes
        totalDutyMinutes += duration;
      } else if (session.duration) {
        totalDutyMinutes += session.duration;
      }

      // Count alerts
      totalAlerts += session.alertsCount || 0;

      // Sum distance
      totalDistance += session.distanceCovered || 0;

      // Perfect performance: 0 alerts AND safety score > 90
      if ((session.alertsCount === 0 || !session.alertsCount) && calculatedSafetyScore > 90) {
        perfectPerformanceSessions += 1;
      }

      // Store recent performance data (last 10 sessions)
      if (recentPerformance.length < 10) {
        recentPerformance.push({
          date: session.startTime,
          safetyScore: calculatedSafetyScore,
          alerts: session.alertsCount || 0,
          duration: session.duration,
          distance: session.distanceCovered || 0,
          status: session.status,
        });
      }

      // Safety trend for last 7 days
      if (new Date(session.startTime) >= sevenDaysAgo) {
        safetyTrend.push({
          date: session.startTime,
          score: calculatedSafetyScore,
        });
      }
    });

    // Calculate averages
    const averageSafetyScore = sessions.length > 0 ? Math.round(totalSafetyScore / sessions.length) : calculatedSafetyScore;
    const totalDutyHours = (totalDutyMinutes / 60).toFixed(2);
    const perfectPerformancePercentage = sessions.length > 0 ? Math.round((perfectPerformanceSessions / sessions.length) * 100) : (calculatedSafetyScore > 90 ? 100 : 0);

    // Calculate performance rating (0-5.0 stars)
    // Based on: safety score (70%), perfect performance (20%), low alerts (10%)
    const safetyComponent = (averageSafetyScore / 100) * 3.5; // max 3.5 stars
    const perfectionComponent = (perfectPerformancePercentage / 100) * 1.0; // max 1.0 star
    const alertComponent = Math.max(0, 0.5 - (Math.min(totalAlerts, 50) / 100)); // max 0.5 star
    const performanceRating = Math.min(5.0, safetyComponent + perfectionComponent + alertComponent).toFixed(1);

    console.log(`✅ Analytics calculated for driver ${driverId}:`);
    console.log(`   Sessions: ${sessions.length}`);
    console.log(`   Avg Safety Score: ${averageSafetyScore}%`);
    console.log(`   Total Duty: ${totalDutyHours}h`);
    console.log(`   Total Alerts: ${totalAlerts}`);
    console.log(`   Perfect Performance: ${perfectPerformancePercentage}%`);
    console.log(`   Rating: ${performanceRating}/5.0`);

    return res.status(200).json({
      success: true,
      data: {
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        totalSessions: sessions.length,
        averageSafetyScore,
        totalDutyHours: parseFloat(totalDutyHours),
        totalDutyMinutes,
        totalDistanceCovered: Math.round(totalDistance),
        totalAlerts,
        perfectPerformanceSessions,
        perfectPerformancePercentage,
        performanceRating: parseFloat(performanceRating),
        recentPerformance,
        safetyTrend,
        lastSessionDate: sessions[0]?.startTime || null,
      }
    });
  } catch (error) {
    console.error('❌ Get driver analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch driver analytics',
      error: error.message,
    });
  }
};

export default {
  getAllDrivers,
  getDriverById,
  getDriverAnalytics,
  createDriver,
  updateDriver,
  deleteDriver,
};
