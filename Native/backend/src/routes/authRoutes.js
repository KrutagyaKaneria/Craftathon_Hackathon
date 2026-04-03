import express from 'express';
import { signup, login, verifyToken, getProfile, debugToken } from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-token', verifyToken);
router.post('/debug-token', debugToken); // Debug endpoint - publicly accessible for testing

// Protected routes
router.get('/profile', verifyAuth, getProfile);

export default router;
