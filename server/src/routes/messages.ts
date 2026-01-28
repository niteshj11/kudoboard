import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { getMessagesContainer, getBoardsContainer } from '../config/database';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { Message, CreateMessageDto, Board } from '../types';
import { Server } from 'socket.io';

const router = Router();

// In-memory storage for development
const inMemoryMessages: Map<string, Message> = new Map();
const inMemoryBoards: Map<string, Board> = new Map();

// Get messages for a board
router.get('/board/:boardId', async (req: AuthRequest, res: Response) => {
  const { boardId } = req.params;
  const container = getMessagesContainer();

  try {
    if (!container) {
      const messages = Array.from(inMemoryMessages.values())
        .filter(m => m.boardId === boardId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      res.json(messages);
      return;
    }

    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.boardId = @boardId ORDER BY c.createdAt ASC',
        parameters: [{ name: '@boardId', value: boardId }]
      })
      .fetchAll();

    res.json(resources);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Create message
router.post(
  '/',
  optionalAuth,
  [
    body('boardId').notEmpty(),
    body('authorName').trim().notEmpty().isLength({ max: 50 }),
    body('content').trim().notEmpty().isLength({ max: 1000 })
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }

    const data: CreateMessageDto = req.body;
    const container = getMessagesContainer();

    // Generate random position if not provided
    const positionX = data.positionX ?? Math.random() * 80 + 10;
    const positionY = data.positionY ?? Math.random() * 60 + 20;
    const rotation = data.rotation ?? (Math.random() - 0.5) * 10;

    const now = new Date().toISOString();
    const message: Message = {
      id: uuidv4(),
      boardId: data.boardId,
      authorName: data.authorName,
      authorEmail: data.authorEmail || req.user?.email,
      content: data.content,
      imageUrl: data.imageUrl,
      gifUrl: data.gifUrl,
      cardColor: data.cardColor || '#ffffff',
      cardStyle: data.cardStyle || 'default',
      positionX,
      positionY,
      rotation,
      createdAt: now,
      updatedAt: now
    };

    try {
      if (!container) {
        inMemoryMessages.set(message.id, message);
      } else {
        await container.items.create(message);
      }

      // Emit real-time update
      const io: Server = req.app.get('io');
      io.to(`board:${data.boardId}`).emit('message:created', message);

      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  }
);

// Update message position
router.patch('/:id/position', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { positionX, positionY, rotation } = req.body;
  const container = getMessagesContainer();

  try {
    let message: Message | null = null;

    if (!container) {
      message = inMemoryMessages.get(id) || null;
      if (message) {
        const updated = {
          ...message,
          positionX: positionX ?? message.positionX,
          positionY: positionY ?? message.positionY,
          rotation: rotation ?? message.rotation,
          updatedAt: new Date().toISOString()
        };
        inMemoryMessages.set(id, updated);

        // Emit real-time update
        const io: Server = req.app.get('io');
        io.to(`board:${message.boardId}`).emit('message:updated', updated);

        res.json(updated);
        return;
      }
    } else {
      // Find and update in Cosmos DB
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id',
          parameters: [{ name: '@id', value: id }]
        })
        .fetchAll();
      
      message = resources[0] || null;

      if (message) {
        const updated = {
          ...message,
          positionX: positionX ?? message.positionX,
          positionY: positionY ?? message.positionY,
          rotation: rotation ?? message.rotation,
          updatedAt: new Date().toISOString()
        };
        await container.item(id, message.boardId).replace(updated);

        const io: Server = req.app.get('io');
        io.to(`board:${message.boardId}`).emit('message:updated', updated);

        res.json(updated);
        return;
      }
    }

    res.status(404).json({ message: 'Message not found' });
  } catch (error) {
    console.error('Error updating message position:', error);
    res.status(500).json({ message: 'Failed to update message' });
  }
});

// Update message content
router.put('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const container = getMessagesContainer();

  try {
    let message: Message | null = null;

    if (!container) {
      message = inMemoryMessages.get(id) || null;
      if (message) {
        const updated = { ...message, ...updates, updatedAt: new Date().toISOString() };
        inMemoryMessages.set(id, updated);

        const io: Server = req.app.get('io');
        io.to(`board:${message.boardId}`).emit('message:updated', updated);

        res.json(updated);
        return;
      }
    } else {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id',
          parameters: [{ name: '@id', value: id }]
        })
        .fetchAll();
      
      message = resources[0] || null;

      if (message) {
        const updated = { ...message, ...updates, updatedAt: new Date().toISOString() };
        await container.item(id, message.boardId).replace(updated);

        const io: Server = req.app.get('io');
        io.to(`board:${message.boardId}`).emit('message:updated', updated);

        res.json(updated);
        return;
      }
    }

    res.status(404).json({ message: 'Message not found' });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Failed to update message' });
  }
});

// Delete message
router.delete('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const container = getMessagesContainer();

  try {
    let message: Message | null = null;

    if (!container) {
      message = inMemoryMessages.get(id) || null;
      if (message) {
        inMemoryMessages.delete(id);

        const io: Server = req.app.get('io');
        io.to(`board:${message.boardId}`).emit('message:deleted', { id, boardId: message.boardId });

        res.status(204).send();
        return;
      }
    } else {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id',
          parameters: [{ name: '@id', value: id }]
        })
        .fetchAll();
      
      message = resources[0] || null;

      if (message) {
        await container.item(id, message.boardId).delete();

        const io: Server = req.app.get('io');
        io.to(`board:${message.boardId}`).emit('message:deleted', { id, boardId: message.boardId });

        res.status(204).send();
        return;
      }
    }

    res.status(404).json({ message: 'Message not found' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

export default router;
