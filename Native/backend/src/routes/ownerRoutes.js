import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getAllOwners,
  getOwnerById,
  getOwnerProfile,
} from '../controllers/ownerController.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (for general info only - NO sensitive data)
// ============================================

// GET all owner names and counts (no drivers/vehicles data)
// GET /api/owners/all (PUBLIC - safe)
router.get('/all', getAllOwners);

// ============================================
// AUTHENTICATED ROUTES (Auth required for detailed owner data)
// ============================================

// GET owner by ID with drivers and vehicles (requires authentication)
// GET /api/owners/:id
router.get('/:id', verifyAuth, getOwnerById);

// GET logged-in owner profile (requires authentication)
// GET /api/owners/profile/me
router.get('/profile/me', verifyAuth, getOwnerProfile);

export default router;
