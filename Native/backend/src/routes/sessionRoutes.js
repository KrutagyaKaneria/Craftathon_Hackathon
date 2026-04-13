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

// Session creation and updates validate ownerId in the controller.
// Keep verifyAuth available for owner-scoped reads, but allow the demo flow to create sessions without a stored JWT.
router.get('/', verifyAuth, getAllSessions);
router.get('/active', verifyAuth, getActiveSessions);
router.get('/:id', verifyAuth, getSessionById);

// GET all sessions
// POST create new session
router.post('/', createSession);

// PUT update session
router.put('/:id', verifyAuth, updateSession);

// PUT update session telemetry data (distance, acceleration, etc)
router.put('/:id/telemetry', verifyAuth, updateSessionTelemetry);

// DELETE session
router.delete('/:id', verifyAuth, deleteSession);

export default router;
