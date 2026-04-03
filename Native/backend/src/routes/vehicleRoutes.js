import express from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByStatus,
  lockVehicle
} from '../controllers/vehicleController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Vehicle Routes
 */

// All vehicle routes require authentication (Disabled for web-app compatibility)
// router.use(verifyAuth);

// Get all vehicles (with optional filters)
// GET /api/vehicles?status=active&protocol_status=ACTIVE&search=DG-001
router.get('/', getAllVehicles);

// Get vehicles by status
// GET /api/vehicles/status/active
router.get('/status/:status', getVehiclesByStatus);

// Get single vehicle by ID
// GET /api/vehicles/:id
router.get('/:id', getVehicleById);

// Create new vehicle
// POST /api/vehicles
router.post('/', createVehicle);

// Update vehicle
// PUT /api/vehicles/:id
router.put('/:id', updateVehicle);

// Lock/Allocate vehicle
// POST /api/vehicles/:id/lock
router.post('/:id/lock', lockVehicle);

// Delete vehicle
// DELETE /api/vehicles/:id
router.delete('/:id', deleteVehicle);

export default router;
