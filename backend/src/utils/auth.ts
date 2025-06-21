import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

// JWT token generation
export const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    team: user.team
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret-key-for-dev',
    { expiresIn: '24h' }
  );
};

// Password comparison
export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Token verification
export interface DecodedToken {
  id: string;
  email: string;
  role: string;
  team: string;
  iat: number;
  exp: number;
}

export const verifyToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key-for-dev'
    ) as DecodedToken;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
