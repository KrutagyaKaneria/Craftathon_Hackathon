import { Vehicle } from '../models/Vehicle.js';
import { Owner } from '../models/Owner.js';
import { io } from '../utils/socketHandler.js';
import { generateRandomVehicleData } from '../utils/vehicleGenerator.js';

/**
 * Vehicle Controller
 * Handles all vehicle-related API endpoints
 */

/**
 * GET /api/vehicles
 * Get all vehicles with optional filters
 */
export const getAllVehicles = async (req, res) => {
  try {
    // Check if this is a public request (no auth) or authenticated request
    const isAuthenticated = !!req.ownerId;
    const isPublicRoute = req.path === '/public/available' || req.baseUrl?.includes('/public/available');
    const isNativeRoute = req.path === '/native/available' || req.baseUrl?.includes('/native/available');

    let ownerId = req.ownerId; // From JWT token (verifyAuth middleware)
    
    console.log(`\n🚗 VEHICLE FETCH REQUEST`);
    console.log(`   Route: ${req.path}`);
    console.log(`   Is Public: ${isPublicRoute}`);
    console.log(`   Is Native: ${isNativeRoute}`);
    console.log(`   Is Authenticated: ${isAuthenticated}`);
    console.log(`   Owner ID from Token: ${ownerId}`);
    
    // If query parameter provided
    if (req.query.ownerId) {
      // If authenticated, verify it matches the token owner
      if (isAuthenticated && req.ownerId && req.query.ownerId !== req.ownerId) {
        console.error(`❌ Owner mismatch - Token owner: ${req.ownerId}, Query owner: ${req.query.ownerId}`);
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Cannot access other owners data',
        });
      }
      ownerId = req.query.ownerId;
      console.log(`   Using owner ID from query: ${ownerId}`);
    }

    // Public route requires ownerId in query parameter
    if (isPublicRoute && !ownerId) {
      console.error('❌ Public vehicles route: ownerId query parameter required');
      return res.status(400).json({
        success: false,
        message: 'ownerId parameter is required for public access',
      });
    }

    // Protected route requires authentication or ownerId
    if (!isPublicRoute && !ownerId) {
      console.error('❌ Vehicles: No ownerId found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required - owner ID not found',
      });
    }

    console.log(`${isPublicRoute ? '🌐 PUBLIC' : '🔐 AUTHENTICATED'} request - Getting vehicles for ownerId: ${ownerId}`);

    // Query filters from request
    const { status, protocol_status, in_transit, search } = req.query;
    const filter = { ownerId }; // Always filter by owner

    if (status) filter.status = status;
    if (protocol_status) filter.protocol_status = protocol_status;
    if (in_transit === 'true') filter.in_transit = true;
    if (in_transit === 'false') filter.in_transit = false;

    if (search) {
      filter.$or = [
        { vehicle_number: { $regex: search, $options: 'i' } },
        { vehicle_name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('   Filters:', filter);

    // Fetch vehicles from database filtered by owner
    const vehicles = await Vehicle.find(filter)
      .populate('assigned_driver', 'email firstName lastName phone')
      .sort({ created_at: -1 })
      .lean();

    console.log(`✅ Query complete - Found ${vehicles.length} vehicles`);
    if (vehicles.length === 0) {
      console.warn(`   ⚠️ No vehicles owned by this account (${ownerId})`);
      console.warn('   → User needs to create vehicles first, or vehicles not assigned to this owner');
    } else {
      console.log('   Vehicle list:');
      vehicles.slice(0, 3).forEach((v, i) => {
        console.log(`     [${i+1}] ${v.vehicle_name} (${v.vehicle_number}) - Status: ${v.status} - Owner: ${v.ownerId}`);
      });
    }

    if (vehicles.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No vehicles available - create vehicles first',
        count: 0
      });
    }

    // Sort to show available first if not filtered
    if (!status) {
      vehicles.sort((a, b) => (a.status === 'available' ? -1 : 1));
    }

    return res.status(200).json({
      success: true,
      data: vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('❌ Get all vehicles error:', {
      message: error.message,
      stack: error.stack.split('\n').slice(0, 3).join('\n')
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message,
    });
  }
};

/**
 * GET /api/vehicles/:id
 * Get vehicle by ID
 */
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.ownerId || req.query.ownerId;
    
    console.log('🚗 Getting vehicle:', id);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - owner ID not found',
      });
    }

    const vehicle = await Vehicle.findById(id)
      .populate('assigned_driver', 'email firstName lastName phone')
      .lean();

    if (!vehicle) {
      console.warn('⚠️ Vehicle not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Verify vehicle belongs to this owner with proper string comparison
    const vehicleOwnerStr = vehicle.ownerId.toString();
    const requestOwnerStr = typeof ownerId === 'object' ? ownerId.toString() : ownerId;
    
    if (vehicleOwnerStr !== requestOwnerStr) {
      console.error(`❌ Owner mismatch for vehicle ${id} - Vehicle owner: ${vehicleOwnerStr}, Request owner: ${requestOwnerStr}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this vehicle',
      });
    }

    console.log('✅ Vehicle found:', vehicle.vehicle_number);
    return res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('❌ Get vehicle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: error.message,
    });
  }
};

/**
 * POST /api/vehicles
 * Create new vehicle
 */
export const createVehicle = async (req, res) => {
  try {
    const ownerId = req.ownerId || req.query.ownerId;
    console.log('🚗 Creating vehicle - ownerId:', ownerId);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Owner ID is required',
      });
    }

    // Check if generating random vehicle data
    const { generateRandom } = req.body;
    let vehicleData;

    if (generateRandom) {
      // Get next vehicle index for this owner
      const vehicleCount = await Vehicle.countDocuments({ ownerId });
      console.log('🎲 Generating random vehicle data...');
      vehicleData = generateRandomVehicleData(ownerId, vehicleCount + 1);
    } else {
      // Use provided data
      const { vehicle_number, vehicle_name, model, year, vin, assigned_driver } = req.body;

      // Validate required fields
      if (!vehicle_number || !vehicle_name) {
        return res.status(400).json({
          success: false,
          message: 'vehicle_number and vehicle_name are required (or set generateRandom: true)',
        });
      }

      vehicleData = {
        vehicle_number,
        vehicle_name,
        model,
        year,
        vin,
        assigned_driver,
        status: 'active',
        protocol_status: 'ACTIVE',
        fuel_level: 75,
        mileage: 0,
        safety_rating: 85,
        last_active: new Date(),
      };
    }

    // Check if vehicle number already exists for this owner
    const existingVehicle = await Vehicle.findOne({ ownerId, vehicle_number: vehicleData.vehicle_number });
    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle number already exists for this owner',
      });
    }

    // Create new vehicle
    const newVehicle = new Vehicle({
      ownerId,
      ...vehicleData,
    });

    const savedVehicle = await newVehicle.save();
    console.log('✅ Vehicle created:', savedVehicle._id);
    if (generateRandom) {
      console.log(`   📊 Generated data: ${vehicleData.vehicle_name} | ${vehicleData.model} | Fuel: ${vehicleData.fuel_level}% | Mileage: ${vehicleData.mileage}km`);
    }

    // Increment owner's totalVehicles count
    await Owner.findByIdAndUpdate(ownerId, { $inc: { totalVehicles: 1 } });

    return res.status(201).json({
      success: true,
      data: savedVehicle,
      message: 'Vehicle created successfully'
    });
  } catch (error) {
    console.error('❌ Create vehicle error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Vehicle ${Object.keys(error.keyValue)[0]} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create vehicle',
      error: error.message,
    });
  }
};

/**
 * PUT /api/vehicles/:id
 * Update vehicle
 */
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.ownerId || req.query.ownerId;

    console.log('🚗 Updating vehicle:', id);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Owner ID is required',
      });
    }

    // Verify vehicle belongs to this owner
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Verify with proper string comparison
    const vehicleOwnerStr = vehicle.ownerId.toString();
    const requestOwnerStr = typeof ownerId === 'object' ? ownerId.toString() : ownerId;
    
    if (vehicleOwnerStr !== requestOwnerStr) {
      console.error(`❌ Owner mismatch for vehicle ${id} - Vehicle owner: ${vehicleOwnerStr}, Request owner: ${requestOwnerStr}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this vehicle',
      });
    }

    // Remove ownerId from request body (cannot change owner)
    delete req.body.ownerId;

    // Find and update vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assigned_driver', 'email firstName lastName phone');

    console.log('✅ Vehicle updated:', updatedVehicle._id);

    return res.status(200).json({
      success: true,
      data: updatedVehicle,
      message: 'Vehicle updated successfully'
    });
  } catch (error) {
    console.error('❌ Update vehicle error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Vehicle ${Object.keys(error.keyValue)[0]} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/vehicles/:id
 * Delete vehicle
 */
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.ownerId || req.query.ownerId;

    console.log('🗑️ Deleting vehicle:', id);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - owner ID not found',
      });
    }

    // Verify vehicle belongs to this owner with proper string comparison
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    const vehicleOwnerStr = vehicle.ownerId.toString();
    const requestOwnerStr = typeof ownerId === 'object' ? ownerId.toString() : ownerId;
    
    if (vehicleOwnerStr !== requestOwnerStr) {
      console.error(`❌ Owner mismatch for vehicle ${id} - Vehicle owner: ${vehicleOwnerStr}, Request owner: ${requestOwnerStr}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this vehicle',
      });
    }

    await Vehicle.findByIdAndDelete(id);

    // Decrement owner's totalVehicles count
    await Owner.findByIdAndUpdate(ownerId, { $inc: { totalVehicles: -1 } });

    console.log('✅ Vehicle deleted:', id);

    return res.status(200).json({
      success: true,
      data: vehicle,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete vehicle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      error: error.message,
    });
  }
};

/**
 * GET /api/vehicles/status/:status
 * Get vehicles by status
 */
export const getVehiclesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    console.log('🚗 Getting vehicles by status:', status);

    const vehicles = await Vehicle.find({ status })
      .populate('assigned_driver', 'email firstName lastName phone')
      .sort({ created_at: -1 })
      .lean();

    console.log(`✅ Found ${vehicles.length} vehicles with status: ${status}`);

    return res.status(200).json({
      success: true,
      data: vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('❌ Get vehicles by status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles by status',
      error: error.message,
    });
  }
};

/**
 * POST /api/vehicles/:id/lock
 * Atomically lock a vehicle for a driver
 */
export const lockVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const ownerId = req.ownerId || req.query.ownerId || req.body.ownerId;

    console.log(`🔐 Attempting to lock vehicle ${id} for driver ${driverId}`);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - owner ID not found',
      });
    }

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required for allocation'
      });
    }

    // Atomic update: only update if status is 'available' or 'active' (repurposed as available)
    const vehicle = await Vehicle.findOneAndUpdate(
      { 
        _id: id, 
        ownerId, 
        status: { $in: ['available', 'active'] } 
      },
      { 
        status: 'in-use', 
        assigned_driver: driverId,
        last_active: new Date(),
        in_transit: true
      },
      { new: true, runValidators: true }
    ).populate('assigned_driver', 'firstName lastName');

    if (!vehicle) {
      // Check if it exists but is already taken
      const exists = await Vehicle.findById(id);
      if (exists) {
        if (exists.status === 'in-use') {
          return res.status(409).json({
            success: false,
            message: 'Bus already selected by another driver'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Bus is currently ${exists.status} and cannot be selected`
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    console.log(`✅ Vehicle ${vehicle.vehicle_number} locked successfully for driver ${driverId}`);

    // Broadcast update to all clients in this owner's room
    if (io) {
      console.log(`📣 Broadcasting vehicle_status_updated for owner:${ownerId}`);
      io.to(`owner:${ownerId}`).emit('vehicle_status_updated', {
        vehicleId: id,
        status: 'in-use',
        vehicleNumber: vehicle.vehicle_number,
        driverId: driverId
      });
    }

    return res.status(200).json({
      success: true,
      data: vehicle,
      message: 'Vehicle allocated successfully'
    });
  } catch (error) {
    console.error('❌ Lock vehicle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to allocate vehicle',
      error: error.message
    });
  }
};

export default {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByStatus,
  lockVehicle,
};
