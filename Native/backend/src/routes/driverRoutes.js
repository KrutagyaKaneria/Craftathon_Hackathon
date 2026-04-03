import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getAllDrivers,
  getDriverById,
  getOwnerDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/driverController.js';

const router = express.Router();

// ============================================
// NATIVE APP ROUTES (Owner-based, auth required)
// ============================================

// GET drivers for logged-in owner ONLY
// GET /api/drivers/owner/me
router.get('/owner/me', verifyAuth, getOwnerDrivers);

// ============================================
// WEBCAM SCREEN ROUTES (All data, no auth)
// ============================================

// GET all drivers from database (for webcam global selection)
// GET /api/drivers
router.get('/', getAllDrivers);

// GET driver by ID with owner details (for webcam selected driver)
// GET /api/drivers/:id
router.get('/:id', getDriverById);

// ============================================
// CREATE/UPDATE/DELETE (can be auth or both)
// ============================================

// POST create new driver
router.post('/', createDriver);

// PUT update driver
router.put('/:id', updateDriver);

// DELETE driver
router.delete('/:id', deleteDriver);

export default router;
