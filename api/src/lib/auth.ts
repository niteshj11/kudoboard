import jwt from 'jsonwebtoken';
import { HttpRequest } from '@azure/functions';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
}

export function generateToken(user: Omit<User, 'passwordHash'>): string {
  const secret = process.env.JWT_SECRET || 'development-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    secret,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'development-secret';
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

export function extractToken(request: HttpRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function authenticateRequest(request: HttpRequest): TokenPayload | null {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}
