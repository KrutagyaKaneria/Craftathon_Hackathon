import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getActiveSessions,
  updateSessionTelemetry,
} from '../controllers/sessionController.js';

const router = express.Router();

// All session routes require authentication for owner-based multi-tenant access control
router.use(verifyAuth);

// GET all sessions
router.get('/', getAllSessions);

// GET active sessions only
router.get('/active', getActiveSessions);

// GET session by ID
router.get('/:id', getSessionById);

// POST create new session
router.post('/', createSession);

// PUT update session
router.put('/:id', updateSession);

// PUT update session telemetry data (distance, acceleration, etc)
router.put('/:id/telemetry', updateSessionTelemetry);

// DELETE session
router.delete('/:id', deleteSession);

export default router;
