import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { getUsersContainer } from '../config/database';
import { generateToken, AuthRequest, authenticateToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { User } from '../types';
import { sendErrorResponse } from '../utils/errorResponse';

const router = Router();

// In-memory storage for development (when Cosmos DB is not configured)
const inMemoryUsers: Map<string, User> = new Map();

async function findUserByEmail(email: string): Promise<User | null> {
  const container = getUsersContainer();
  
  if (!container) {
    // Use in-memory storage
    for (const user of inMemoryUsers.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  try {
    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: email }]
      })
      .fetchAll();
    
    return resources[0] || null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

async function createUser(user: User): Promise<User> {
  const container = getUsersContainer();
  
  if (!container) {
    inMemoryUsers.set(user.id, user);
    return user;
  }

  const { resource } = await container.items.create(user);
  return resource as User;
}

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty()
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }

    const { email, password, name } = req.body;

    try {
      // Check if user exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        res.status(409).json({ message: 'Email already registered' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const now = new Date().toISOString();
      const user: User = {
        id: uuidv4(),
        email,
        name,
        passwordHash,
        createdAt: now,
        updatedAt: now
      };

      await createUser(user);

      // Generate token
      const { passwordHash: _, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);

      res.status(201).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      sendErrorResponse(res, error, 'Registration');
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      const user = await findUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);

      res.json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      sendErrorResponse(res, error, 'Login');
    }
  }
);

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Google OAuth callback (simplified)
router.post('/google', async (req: AuthRequest, res: Response) => {
  const { googleId, email, name, avatarUrl } = req.body;

  if (!googleId || !email) {
    res.status(400).json({ message: 'Google ID and email required' });
    return;
  }

  try {
    let user = await findUserByEmail(email);

    if (!user) {
      const now = new Date().toISOString();
      user = {
        id: uuidv4(),
        email,
        name: name || email.split('@')[0],
        googleId,
        avatarUrl,
        createdAt: now,
        updatedAt: now
      };
      await createUser(user);
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    sendErrorResponse(res, error, 'Google authentication');
  }
});

export default router;
