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
 * Public routes for web app driver selection (no auth required)
 * Protected routes for native app and management (auth required)
 */

// PUBLIC ROUTES - No authentication required
// Get available vehicles for a specific owner (used in web app for driver selection)
// GET /api/vehicles/public/available?ownerId=xxx
router.get('/public/available', getAllVehicles);

// ============================================
// NATIVE APP PROTECTED ROUTES (Auth required)
// ============================================

// Get available vehicles for logged-in owner ONLY (REQUIRES AUTH - for native app)
// GET /api/vehicles/native/available
router.get('/native/available', verifyAuth, getAllVehicles);

// All other vehicle routes require authentication
router.use(verifyAuth);

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
