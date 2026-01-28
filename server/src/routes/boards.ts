import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { getBoardsContainer } from '../config/database';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { Board, CreateBoardDto } from '../types';

const router = Router();

// In-memory storage for development
const inMemoryBoards: Map<string, Board> = new Map();

function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Get all boards for current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const container = getBoardsContainer();

  try {
    if (!container) {
      const boards = Array.from(inMemoryBoards.values())
        .filter(b => b.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(boards);
      return;
    }

    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: userId }]
      })
      .fetchAll();

    res.json(resources);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ message: 'Failed to fetch boards' });
  }
});

// Get board by share code (public access)
router.get('/share/:shareCode', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { shareCode } = req.params;
  const { password } = req.query;
  const container = getBoardsContainer();

  try {
    let board: Board | null = null;

    if (!container) {
      board = Array.from(inMemoryBoards.values())
        .find(b => b.shareCode === shareCode) || null;
    } else {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.shareCode = @shareCode',
          parameters: [{ name: '@shareCode', value: shareCode }]
        })
        .fetchAll();
      board = resources[0] || null;
    }

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Check if board is expired
    if (board.expiresAt && new Date(board.expiresAt) < new Date()) {
      res.status(410).json({ message: 'This board has expired' });
      return;
    }

    // Check password if required
    if (board.password && board.password !== password) {
      res.status(401).json({ message: 'Password required', requiresPassword: true });
      return;
    }

    // Remove sensitive data
    const { password: _, ...publicBoard } = board;
    res.json(publicBoard);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ message: 'Failed to fetch board' });
  }
});

// Get board by ID (owner only)
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const container = getBoardsContainer();

  try {
    let board: Board | null = null;

    if (!container) {
      board = inMemoryBoards.get(id) || null;
    } else {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId',
          parameters: [
            { name: '@id', value: id },
            { name: '@userId', value: userId }
          ]
        })
        .fetchAll();
      board = resources[0] || null;
    }

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    res.json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ message: 'Failed to fetch board' });
  }
});

// Create board
router.post(
  '/',
  authenticateToken,
  [
    body('title').trim().notEmpty().isLength({ max: 100 }),
    body('recipientName').trim().notEmpty().isLength({ max: 50 }),
    body('occasion').isIn([
      'birthday', 'farewell', 'congratulations', 'thank-you',
      'welcome', 'anniversary', 'get-well', 'holiday', 'other'
    ])
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }

    const userId = req.user!.id;
    const data: CreateBoardDto = req.body;
    const container = getBoardsContainer();

    const now = new Date().toISOString();
    const board: Board = {
      id: uuidv4(),
      userId,
      title: data.title,
      recipientName: data.recipientName,
      occasion: data.occasion,
      description: data.description,
      backgroundColor: data.backgroundColor || '#f0f4f8',
      backgroundPattern: data.backgroundPattern,
      isPublic: data.isPublic !== false,
      password: data.password,
      shareCode: generateShareCode(),
      expiresAt: data.expiresAt,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (!container) {
        inMemoryBoards.set(board.id, board);
      } else {
        await container.items.create(board);
      }

      res.status(201).json(board);
    } catch (error) {
      console.error('Error creating board:', error);
      res.status(500).json({ message: 'Failed to create board' });
    }
  }
);

// Update board
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const updates = req.body;
  const container = getBoardsContainer();

  try {
    let board: Board | null = null;

    if (!container) {
      board = inMemoryBoards.get(id) || null;
      if (board && board.userId === userId) {
        const updatedBoard = { ...board, ...updates, updatedAt: new Date().toISOString() };
        inMemoryBoards.set(id, updatedBoard);
        res.json(updatedBoard);
        return;
      }
    } else {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId',
          parameters: [
            { name: '@id', value: id },
            { name: '@userId', value: userId }
          ]
        })
        .fetchAll();
      board = resources[0] || null;

      if (board) {
        const updatedBoard = { ...board, ...updates, updatedAt: new Date().toISOString() };
        await container.item(id, userId).replace(updatedBoard);
        res.json(updatedBoard);
        return;
      }
    }

    res.status(404).json({ message: 'Board not found' });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ message: 'Failed to update board' });
  }
});

// Delete board
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const container = getBoardsContainer();

  try {
    if (!container) {
      const board = inMemoryBoards.get(id);
      if (board && board.userId === userId) {
        inMemoryBoards.delete(id);
        res.status(204).send();
        return;
      }
    } else {
      await container.item(id, userId).delete();
      res.status(204).send();
      return;
    }

    res.status(404).json({ message: 'Board not found' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ message: 'Failed to delete board' });
  }
});

export default router;
