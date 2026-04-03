import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getAllOwners,
  getOwnerById,
  getOwnerProfile,
} from '../controllers/ownerController.js';

const router = express.Router();

// ============================================
// WEBCAM SCREEN ROUTES (All data, no auth)
// ============================================

// GET all owners from database (for webcam to show all owner buses)
// GET /api/owners/all
router.get('/all', getAllOwners);

// GET owner by ID with associated drivers and vehicles
// GET /api/owners/:id
router.get('/:id', getOwnerById);

// ============================================
// NATIVE APP ROUTES (Auth required)
// ============================================

// GET logged-in owner profile
// GET /api/owners/me
router.get('/profile/me', verifyAuth, getOwnerProfile);

export default router;
