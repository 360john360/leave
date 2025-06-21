import { Request, Response } from 'express';
import { PrismaClient, UserRole, ShiftTeam } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

// Get all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
};

// Create new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, team, isActive = true } = req.body;

    // Validate input
    if (!name || !email || !password || !role || !team) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    // Validate role and team
    if (!Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    if (!Object.values(ShiftTeam).includes(team as ShiftTeam)) {
      res.status(400).json({ message: 'Invalid team' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        team: team as ShiftTeam,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log user creation
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        actionType: 'USER_CREATED',
        details: `User ${newUser.email} created with role ${newUser.role}`,
        targetEntityId: newUser.id,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, team, isActive, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined && email !== existingUser.email) {
      // Check if new email is already in use
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }

      updateData.email = email;
    }
    if (role !== undefined) {
      if (!Object.values(UserRole).includes(role as UserRole)) {
        res.status(400).json({ message: 'Invalid role' });
        return;
      }
      updateData.role = role;
    }
    if (team !== undefined) {
      if (!Object.values(ShiftTeam).includes(team as ShiftTeam)) {
        res.status(400).json({ message: 'Invalid team' });
        return;
      }
      updateData.team = team;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log user update
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        actionType: 'USER_UPDATED',
        details: `User ${updatedUser.email} updated`,
        targetEntityId: updatedUser.id,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
};

// Delete user (soft delete by setting isActive to false)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Soft delete by setting isActive to false
    const deletedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Log user deletion
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        actionType: 'USER_DELETED',
        details: `User ${deletedUser.email} deactivated`,
        targetEntityId: deletedUser.id,
      },
    });

    res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};
