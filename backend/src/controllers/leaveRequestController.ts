import { Request, Response } from 'express';
import { PrismaClient, LeaveRequestStatus, LeaveRequestType } from '@prisma/client';

const prisma = new PrismaClient();

// Get all leave requests (filtered by user role)
export const getAllLeaveRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    const currentUser = req.user;

    if (!currentUser) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    let whereClause: any = {};

    // Filter by userId if provided (and authorized)
    if (userId) {
      // Admin and Manager can view any user's leave requests
      // Regular users can only view their own
      if (currentUser.role === 'USER' && userId !== currentUser.id) {
        res.status(403).json({ message: 'Unauthorized to view other users leave requests' });
        return;
      }
      whereClause.userId = userId as string;
    } else if (currentUser.role === 'USER') {
      // Regular users can only see their own leave requests
      whereClause.userId = currentUser.id;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            team: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    res.status(200).json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ message: 'Server error fetching leave requests' });
  }
};

// Get leave request by ID
export const getLeaveRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            team: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    // Check authorization - only allow users to view their own leave requests
    // unless they are an admin or manager
    if (
      currentUser.role === 'USER' &&
      leaveRequest.userId !== currentUser.id
    ) {
      res.status(403).json({ message: 'Unauthorized to view this leave request' });
      return;
    }

    res.status(200).json(leaveRequest);
  } catch (error) {
    console.error('Error fetching leave request:', error);
    res.status(500).json({ message: 'Server error fetching leave request' });
  }
};

// Create new leave request
export const createLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, type, notes } = req.body;
    const currentUser = req.user;

    if (!currentUser?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Validate input
    if (!startDate || !endDate || !type) {
      res.status(400).json({ message: 'Start date, end date, and type are required' });
      return;
    }

    // Validate leave request type
    if (!Object.values(LeaveRequestType).includes(type as LeaveRequestType)) {
      res.status(400).json({ message: 'Invalid leave request type' });
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ message: 'Invalid date format' });
      return;
    }

    if (start > end) {
      res.status(400).json({ message: 'Start date must be before end date' });
      return;
    }

    if (start < new Date()) {
      res.status(400).json({ message: 'Cannot create leave request for past dates' });
      return;
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: currentUser.id,
        startDate: start,
        endDate: end,
        type: type as LeaveRequestType,
        status: LeaveRequestStatus.PENDING,
        notes: notes || '',
      },
    });

    // Log leave request creation
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        actionType: 'LEAVE_REQUEST_CREATED',
        details: `Leave request created for ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
        targetEntityId: leaveRequest.id,
      },
    });

    // Create notification for managers
    const managers = await prisma.user.findMany({
      where: {
        role: 'MANAGER',
        isActive: true,
      },
    });

    for (const manager of managers) {
      await prisma.notification.create({
        data: {
          userId: manager.id,
          title: 'New Leave Request',
          message: `${currentUser.name} has requested leave from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
          isRead: false,
          type: 'LEAVE_REQUEST',
          linkId: leaveRequest.id,
        },
      });
    }

    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Server error creating leave request' });
  }
};

// Update leave request status (approve/reject)
export const updateLeaveRequestStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const currentUser = req.user;

    if (!currentUser?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Validate status
    if (!status || !Object.values(LeaveRequestStatus).includes(status as LeaveRequestStatus)) {
      res.status(400).json({ message: 'Valid status is required' });
      return;
    }

    // Check if leave request exists
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!leaveRequest) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    // Check authorization - only managers and admins can approve/reject
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      res.status(403).json({ message: 'Unauthorized to update leave request status' });
      return;
    }

    // Update leave request
    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: status as LeaveRequestStatus,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        notes: notes || leaveRequest.notes,
      },
    });

    // Log leave request update
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        actionType: 'LEAVE_REQUEST_UPDATED',
        details: `Leave request ${status.toLowerCase()} by ${currentUser.name}`,
        targetEntityId: leaveRequest.id,
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: leaveRequest.userId,
        title: `Leave Request ${status === LeaveRequestStatus.APPROVED ? 'Approved' : 'Rejected'}`,
        message: `Your leave request from ${leaveRequest.startDate.toISOString().split('T')[0]} to ${leaveRequest.endDate.toISOString().split('T')[0]} has been ${status.toLowerCase()}`,
        isRead: false,
        type: 'LEAVE_REQUEST',
        linkId: leaveRequest.id,
      },
    });

    res.status(200).json(updatedLeaveRequest);
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Server error updating leave request' });
  }
};

// Cancel leave request (only for pending requests by the owner)
export const cancelLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Check if leave request exists
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    // Check authorization - only the owner can cancel their request
    // or an admin/manager can cancel any request
    if (
      leaveRequest.userId !== currentUser.id &&
      currentUser.role !== 'ADMIN' &&
      currentUser.role !== 'MANAGER'
    ) {
      res.status(403).json({ message: 'Unauthorized to cancel this leave request' });
      return;
    }

    // Check if request is pending
    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      res.status(400).json({ message: 'Only pending leave requests can be cancelled' });
      return;
    }

    // Update leave request status to CANCELLED
    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.CANCELLED,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
      },
    });

    // Log leave request cancellation
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        actionType: 'LEAVE_REQUEST_CANCELLED',
        details: `Leave request cancelled by ${currentUser.name}`,
        targetEntityId: leaveRequest.id,
      },
    });

    // If cancelled by admin/manager and not the owner, notify the owner
    if (leaveRequest.userId !== currentUser.id) {
      await prisma.notification.create({
        data: {
          userId: leaveRequest.userId,
          title: 'Leave Request Cancelled',
          message: `Your leave request from ${leaveRequest.startDate.toISOString().split('T')[0]} to ${leaveRequest.endDate.toISOString().split('T')[0]} has been cancelled by ${currentUser.name}`,
          isRead: false,
          type: 'LEAVE_REQUEST',
          linkId: leaveRequest.id,
        },
      });
    }

    res.status(200).json(updatedLeaveRequest);
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    res.status(500).json({ message: 'Server error cancelling leave request' });
  }
};
