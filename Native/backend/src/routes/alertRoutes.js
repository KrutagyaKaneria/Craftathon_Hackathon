import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  markAsResolved,
  getHighRiskAlerts,
} from '../controllers/alertController.js';

const router = express.Router();

// All alert routes require authentication for owner-based multi-tenant access control
router.use(verifyAuth);

// GET all alerts
router.get('/', getAllAlerts);

// GET high-risk alerts only
router.get('/high-risk', getHighRiskAlerts);

// GET alert by ID
router.get('/:id', getAlertById);

// POST create new alert
router.post('/', createAlert);

// PUT update alert
router.put('/:id', updateAlert);

// PUT mark alert as resolved
router.put('/:id/resolve', markAsResolved);

// DELETE alert
router.delete('/:id', deleteAlert);

export default router;
