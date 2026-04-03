import { Driver } from '../models/Driver.js';
import { Owner } from '../models/Owner.js';

/**
 * Driver Controller
 * Handles all driver-related API endpoints
 */

export const getAllDrivers = async (req, res) => {
  try {
    console.log('👤 Fetching ALL drivers from database (global load)');

    // Fetch ALL drivers from database for the global selection screen
    const drivers = await Driver.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Loaded ${drivers.length} drivers globally`);
    drivers.forEach((driver, index) => {
      console.log(`  [${index + 1}] ${driver.firstName} (Owner: ${driver.ownerId}): profilePhoto ${driver.profilePhoto ? '✓ ' + (driver.profilePhoto.length / 1024 / 1024).toFixed(2) + 'MB' : '✗'}`);
    });

    return res.status(200).json({
      success: true,
      data: drivers,
      count: drivers.length
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
    const ownerId = req.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';
    console.log('👤 Getting driver:', id);

    const driver = await Driver.findById(id)
      .select('-password')
      .lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    // Verify driver belongs to this owner
    if (driver.ownerId.toString() !== ownerId) {
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
    const ownerId = req.ownerId || req.body.ownerId || '69cfd750239cb96c7844acb5';

    console.log('📝 Updating driver:', id);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Owner ID is required',
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

    if (driver.ownerId.toString() !== ownerId) {
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
    const ownerId = req.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';

    console.log('🗑️ Deleting driver:', id);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Owner ID is required',
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

    if (driver.ownerId.toString() !== ownerId) {
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

export default {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
};
