import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: Omit<User, 'passwordHash'>;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'development-secret';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired token' });
      return;
    }

    req.user = decoded as Omit<User, 'passwordHash'>;
    next();
  });
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  const secret = process.env.JWT_SECRET || 'development-secret';

  jwt.verify(token, secret, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded as Omit<User, 'passwordHash'>;
    }
    next();
  });
}

export function generateToken(user: Omit<User, 'passwordHash'>): string {
  const secret = process.env.JWT_SECRET || 'development-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    secret,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
}
