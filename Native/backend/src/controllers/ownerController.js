import { Owner } from '../models/Owner.js';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';

/**
 * Owner Controller
 * Handles owner-related API endpoints
 */

/**
 * GET /api/owners/all
 * Fetch ALL owners from database (for webcam to show all owner buses/drivers)
 * No authentication required - for webcam global view
 */
export const getAllOwners = async (req, res) => {
  try {
    console.log('🏢 Fetching ALL owners from database (webcam global load)');

    // Fetch ALL owners from database
    const owners = await Owner.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Loaded ${owners.length} owners globally`);
    owners.forEach((owner, index) => {
      console.log(`  [${index + 1}] ${owner.firstName} ${owner.lastName} (${owner.email}) - Drivers: ${owner.totalDrivers}, Vehicles: ${owner.totalVehicles}`);
    });

    return res.status(200).json({
      success: true,
      data: owners,
      count: owners.length
    });
  } catch (error) {
    console.error('❌ Get all owners error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch owners',
      error: error.message,
    });
  }
};

/**
 * GET /api/owners/:id
 * Fetch specific owner with associated drivers and vehicles
 * For webcam to show selected owner's buses and drivers
 */
export const getOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🏢 Getting owner:', id);

    // Get owner details
    const owner = await Owner.findById(id)
      .select('-password')
      .lean();

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }

    // Get owner's drivers
    const drivers = await Driver.find({ ownerId: id })
      .select('_id firstName lastName email phone profilePhoto licenseNumber assignedVehicle')
      .lean();

    // Get owner's vehicles
    const vehicles = await Vehicle.find({ ownerId: id })
      .select('_id vehicle_number vehicle_name status mileage fuel_level safety_rating assigned_driver last_active')
      .lean();

    console.log(`✅ Owner found: ${owner.firstName} ${owner.lastName}`);
    console.log(`   - Drivers: ${drivers.length}`);
    console.log(`   - Vehicles: ${vehicles.length}`);

    return res.status(200).json({
      success: true,
      data: {
        owner,
        drivers,
        vehicles,
        summary: {
          totalDrivers: drivers.length,
          totalVehicles: vehicles.length
        }
      }
    });
  } catch (error) {
    console.error('❌ Get owner error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch owner',
      error: error.message,
    });
  }
};

/**
 * GET /api/owners/profile/me
 * Fetch logged-in owner profile with statistics
 * Native app - requires authentication
 */
export const getOwnerProfile = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    console.log('🏢 Getting profile for owner:', ownerId);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Owner ID is required - not authenticated',
      });
    }

    // Get owner details
    const owner = await Owner.findById(ownerId)
      .select('-password')
      .lean();

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }

    // Get owner's drivers
    const drivers = await Driver.find({ ownerId })
      .select('_id firstName lastName email phone licenseNumber')
      .lean();

    // Get owner's vehicles
    const vehicles = await Vehicle.find({ ownerId })
      .select('_id vehicle_number vehicle_name status mileage')
      .lean();

    console.log(`✅ Profile retrieved for: ${owner.firstName} ${owner.lastName}`);

    return res.status(200).json({
      success: true,
      data: {
        owner,
        drivers,
        vehicles,
        statistics: {
          totalDrivers: drivers.length,
          totalVehicles: vehicles.length,
          activeDrivers: drivers.length,
          activeVehicles: vehicles.filter(v => v.status === 'active').length
        }
      }
    });
  } catch (error) {
    console.error('❌ Get owner profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch owner profile',
      error: error.message,
    });
  }
};
