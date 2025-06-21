import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/users - Get all users (Admin, Manager)
router.get('/', authorize([UserRole.ADMIN, UserRole.MANAGER]), getAllUsers);

// GET /api/users/:id - Get user by ID (Admin, Manager, or self)
router.get('/:id', getUserById);

// POST /api/users - Create new user (Admin only)
router.post('/', authorize([UserRole.ADMIN]), createUser);

// PUT /api/users/:id - Update user (Admin, or self for limited fields)
router.put('/:id', updateUser);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authorize([UserRole.ADMIN]), deleteUser);

export default router;
