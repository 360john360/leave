import express from 'express';
import { login, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me - Get current user info (requires authentication)
router.get('/me', authenticate, getCurrentUser);

export default router;
