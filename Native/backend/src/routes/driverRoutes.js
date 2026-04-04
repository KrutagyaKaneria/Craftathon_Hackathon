import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getAllDrivers,
  getDriverById,
  getOwnerDrivers,
  getDriverAnalytics,
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
// AUTHENTICATED ROUTES (All require auth for owner verification)
// ============================================

// GET all drivers for authenticated owner
// GET /api/drivers?ownerId=xxx (requires authentication)
router.get('/', verifyAuth, getAllDrivers);

// GET driver analytics by ID
// GET /api/drivers/:id/analytics (requires authentication)
router.get('/:id/analytics', verifyAuth, getDriverAnalytics);

// GET driver by ID with owner verification
// GET /api/drivers/:id (requires authentication)
router.get('/:id', verifyAuth, getDriverById);

// ============================================
// CREATE/UPDATE/DELETE (all require authentication)
// ============================================

// POST create new driver
router.post('/', verifyAuth, createDriver);

// PUT update driver
router.put('/:id', verifyAuth, updateDriver);

// DELETE driver
router.delete('/:id', verifyAuth, deleteDriver);

export default router;
