import { Vehicle } from '../models/Vehicle.js';
import { Owner } from '../models/Owner.js';
import { io } from '../utils/socketHandler.js';

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
    const ownerId = req.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';
    console.log('🚗 Getting all vehicles - ownerId:', ownerId);

    if (!ownerId) {
      console.error('❌ Vehicles: No ownerId found in request');
      return res.status(401).json({
        success: false,
        message: 'Owner ID is required',
      });
    }

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

    console.log('🔍 Vehicle filter:', filter);

    // Fetch vehicles from database filtered by owner
    const vehicles = await Vehicle.find(filter)
      .populate('assigned_driver', 'email firstName lastName phone')
      .sort({ created_at: -1 })
      .lean();

    console.log(`✅ Found ${vehicles.length} vehicles for owner ${ownerId}`);

    if (vehicles.length === 0) {
      console.log('📭 No vehicles found for this owner');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No vehicles available',
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
    console.error('❌ Get all vehicles error:', error);
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
    const ownerId = req.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';
    console.log('🚗 Getting vehicle:', id);

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

    // Verify vehicle belongs to this owner
    if (vehicle.ownerId.toString() !== ownerId) {
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
    const ownerId = req.ownerId || req.body.ownerId || '69cfd750239cb96c7844acb5';
    console.log('🚗 Creating vehicle - ownerId:', ownerId);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Owner ID is required',
      });
    }

    const { vehicle_number, vehicle_name, model, year, vin, assigned_driver } = req.body;

    // Validate required fields
    if (!vehicle_number || !vehicle_name) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_number and vehicle_name are required',
      });
    }

    // Check if vehicle number already exists for this owner
    const existingVehicle = await Vehicle.findOne({ ownerId, vehicle_number });
    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle number already exists for this owner',
      });
    }

    // Create new vehicle
    const newVehicle = new Vehicle({
      ownerId,
      vehicle_number,
      vehicle_name,
      model,
      year,
      vin,
      assigned_driver,
      status: 'active',
      protocol_status: 'ACTIVE',
      last_active: new Date(),
    });

    const savedVehicle = await newVehicle.save();
    console.log('✅ Vehicle created:', savedVehicle._id);

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
    const ownerId = req.ownerId || req.body.ownerId || '69cfd750239cb96c7844acb5';

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

    if (vehicle.ownerId.toString() !== ownerId) {
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
    const ownerId = req.ownerId || req.body.ownerId || req.query.ownerId || '69cfd750239cb96c7844acb5';

    console.log('🗑️ Deleting vehicle:', id);

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

    if (vehicle.ownerId.toString() !== ownerId) {
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
    const ownerId = req.ownerId || req.body.ownerId || '69cfd750239cb96c7844acb5';

    console.log(`🔐 Attempting to lock vehicle ${id} for driver ${driverId}`);

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
