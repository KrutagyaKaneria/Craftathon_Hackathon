import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/driverController.js';

const router = express.Router();

// All driver routes require authentication
router.use(verifyAuth);

// GET all drivers
router.get('/', getAllDrivers);

// GET driver by ID
router.get('/:id', getDriverById);

// POST create new driver
router.post('/', createDriver);

// PUT update driver
router.put('/:id', updateDriver);

// DELETE driver
router.delete('/:id', deleteDriver);

export default router;
