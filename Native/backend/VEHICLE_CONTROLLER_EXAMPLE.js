/**
 * EXAMPLE: Vehicle Controller Implementation
 * Shows how to integrate the vehicle generator into API endpoints
 * 
 * Copy relevant parts into your actual vehicleController.js
 */

import { createVehicleObject, generateRandomVehicleData } from '../utils/vehicleGenerator.js';
import { Vehicle } from '../models/Vehicle.js';

/**
 * Create a new vehicle
 * 
 * REQUEST OPTIONS:
 * 1. POST /api/vehicles { "generateRandom": true }
 *    → Creates vehicle with all random details
 * 
 * 2. POST /api/vehicles { "vehicle_number": "BUS-001", "vehicle_name": "My Bus" }
 *    → Creates vehicle with auto-generated model, year, mileage, etc.
 * 
 * 3. POST /api/vehicles { "vehicle_number": "BUS-001", "vehicle_name": "My Bus", "safety_rating": 90, ... }
 *    → Creates vehicle with provided values, fills in rest
 */
export const createVehicle = async (req, res) => {
  try {
    const ownerId = req.user.ownerId; // From auth middleware
    const { vehicle_number, vehicle_name, generateRandom, ...customData } = req.body;

    let vehicleData;

    if (generateRandom) {
      // ========= OPTION 1: Fully random vehicle ==========
      // Get count of existing vehicles to generate next index
      const count = await Vehicle.countDocuments({ ownerId });
      vehicleData = generateRandomVehicleData(ownerId, count + 1);
      
    } else if (vehicle_number && vehicle_name) {
      // ========= OPTION 2: User provides name, we fill rest ==========
      vehicleData = createVehicleObject(vehicle_number, vehicle_name, customData);
      
    } else {
      return res.status(400).json({ 
        error: 'Provide vehicle_number + vehicle_name, or set generateRandom: true' 
      });
    }

    // Create and save vehicle
    const vehicle = new Vehicle({
      ...vehicleData,
      ownerId, // Add owner reference
    });

    await vehicle.save();

    // Return complete vehicle object
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle: {
        _id: vehicle._id,
        vehicle_number: vehicle.vehicle_number,
        vehicle_name: vehicle.vehicle_name,
        model: vehicle.model,
        year: vehicle.year,
        safety_rating: vehicle.safety_rating,
        fuel_level: vehicle.fuel_level,
        mileage: vehicle.mileage,
        status: vehicle.status,
        protocol_status: vehicle.protocol_status,
        location: vehicle.location,
        assigned_driver: vehicle.assigned_driver,
        created_at: vehicle.created_at,
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Vehicle number already exists for this owner' 
      });
    }
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

/**
 * Get all vehicles for owner with stats
 * Returns dashboard statistics shown in the app UI
 */
export const getAllVehicles = async (req, res) => {
  try {
    const ownerId = req.user.ownerId;
    
    // Fetch vehicles
    const vehicles = await Vehicle.find({ ownerId })
      .populate('assigned_driver', 'name')
      .lean();

    // Calculate dashboard stats
    const stats = {
      totalVehicles: vehicles.length,
      activeUnits: vehicles.filter(v => v.status === 'in-use').length,
      avgSafety: vehicles.length > 0 
        ? Math.round(vehicles.reduce((sum, v) => sum + v.safety_rating, 0) / vehicles.length)
        : 0,
      fuelLow: vehicles.filter(v => v.fuel_level < 30).length,
      maintenanceNeeded: vehicles.filter(v => v.status === 'maintenance').length,
    };

    res.json({
      success: true,
      stats,
      vehicles,
    });

  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

/**
 * Update vehicle details
 * Can update any field shown in the UI
 */
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.ownerId;
    const updateData = req.body;

    // Allowed fields to update
    const allowedFields = [
      'vehicle_name',
      'safety_rating',
      'fuel_level',
      'mileage',
      'status',
      'protocol_status',
      'assigned_driver',
      'notes',
      'maintenance_due',
    ];

    // Filter to only allowed fields
    const updates = {};
    allowedFields.forEach(field => {
      if (field in updateData) {
        updates[field] = updateData[field];
      }
    });

    updates.updated_at = new Date();

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: id, ownerId },
      updates,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle,
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

/**
 * Get detailed view of single vehicle
 * Used when user clicks on vehicle in the list
 */
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user?.ownerId;

    const vehicle = await Vehicle.findOne({ _id: id, ownerId })
      .populate('assigned_driver', 'name email phone');

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Return all fields needed for detailed view
    res.json({
      success: true,
      vehicle: {
        _id: vehicle._id,
        vehicle_number: vehicle.vehicle_number,
        vehicle_name: vehicle.vehicle_name,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        status: vehicle.status,
        protocol_status: vehicle.protocol_status,
        safety_rating: vehicle.safety_rating,
        fuel_level: vehicle.fuel_level,
        mileage: vehicle.mileage,
        location: vehicle.location,
        assigned_driver: vehicle.assigned_driver,
        maintenance_due: vehicle.maintenance_due,
        recent_performance: vehicle.recent_performance,
        notes: vehicle.notes,
        last_active: vehicle.last_active,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
      }
    });

  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
};

/**
 * Assign driver to vehicle
 */
export const assignDriver = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { driverId } = req.body;
    const ownerId = req.user.ownerId;

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: vehicleId, ownerId },
      { 
        assigned_driver: driverId,
        status: 'in-use',
        protocol_status: 'ACTIVE',
        updated_at: new Date()
      },
      { new: true }
    ).populate('assigned_driver', 'name');

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({
      success: true,
      message: 'Driver assigned successfully',
      vehicle,
    });

  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({ error: 'Failed to assign driver' });
  }
};

/**
 * Update vehicle fuel/battery level (from IoT device or manual input)
 */
export const updateFuelLevel = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { fuel_level } = req.body;
    const ownerId = req.user.ownerId;

    // Validate fuel level
    if (typeof fuel_level !== 'number' || fuel_level < 0 || fuel_level > 100) {
      return res.status(400).json({ error: 'Fuel level must be 0-100' });
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: vehicleId, ownerId },
      { 
        fuel_level,
        // Auto-set status to maintenance if fuel is critically low
        status: fuel_level < 10 ? 'maintenance' : vehicle.status,
        last_active: new Date(),
        updated_at: new Date()
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({
      success: true,
      message: 'Fuel level updated',
      vehicle: {
        vehicle_number: vehicle.vehicle_number,
        fuel_level: vehicle.fuel_level,
        status: vehicle.status,
      }
    });

  } catch (error) {
    console.error('Update fuel error:', error);
    res.status(500).json({ error: 'Failed to update fuel level' });
  }
};

/**
 * Search/filter vehicles
 */
export const searchVehicles = async (req, res) => {
  try {
    const ownerId = req.user.ownerId;
    const { search, status, fuelLow } = req.query;

    let query = { ownerId };

    // Search by vehicle number or name
    if (search) {
      query.$or = [
        { vehicle_number: { $regex: search, $options: 'i' } },
        { vehicle_name: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter fuel low
    if (fuelLow === 'true') {
      query.fuel_level = { $lt: 30 };
    }

    const vehicles = await Vehicle.find(query)
      .populate('assigned_driver', 'name')
      .lean();

    res.json({
      success: true,
      count: vehicles.length,
      vehicles,
    });

  } catch (error) {
    console.error('Search vehicles error:', error);
    res.status(500).json({ error: 'Failed to search vehicles' });
  }
};

export default {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  assignDriver,
  updateFuelLevel,
  searchVehicles,
};
