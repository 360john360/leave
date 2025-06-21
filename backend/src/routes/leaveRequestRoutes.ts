import express from 'express';
import { 
  getAllLeaveRequests, 
  getLeaveRequestById, 
  createLeaveRequest, 
  updateLeaveRequestStatus, 
  cancelLeaveRequest 
} from '../controllers/leaveRequestController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/leave-requests - Get all leave requests (filtered by role)
router.get('/', getAllLeaveRequests);

// GET /api/leave-requests/:id - Get leave request by ID
router.get('/:id', getLeaveRequestById);

// POST /api/leave-requests - Create new leave request
router.post('/', createLeaveRequest);

// PUT /api/leave-requests/:id/status - Update leave request status (approve/reject)
router.put('/:id/status', authorize([UserRole.ADMIN, UserRole.MANAGER]), updateLeaveRequestStatus);

// PUT /api/leave-requests/:id/cancel - Cancel leave request
router.put('/:id/cancel', cancelLeaveRequest);

export default router;
