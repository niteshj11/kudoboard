import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { getContainer, getInMemoryStore } from '../lib/database.js';
import { authenticateRequest } from '../lib/auth.js';
import { Board } from '../lib/types.js';

function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Get user's boards
export async function getBoards(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request);
  if (!auth) {
    return { status: 401, jsonBody: { message: 'Authentication required' } };
  }

  try {
    const container = await getContainer('boards');
    let boards: Board[] = [];

    if (container) {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
          parameters: [{ name: '@userId', value: auth.id }],
        })
        .fetchAll();
      boards = resources;
    } else {
      const store = getInMemoryStore('boards');
      boards = Array.from(store.values())
        .filter((b) => (b as Board).userId === auth.id)
        .sort((a, b) => new Date((b as Board).createdAt).getTime() - new Date((a as Board).createdAt).getTime()) as Board[];
    }

    return {
      status: 200,
      jsonBody: boards,
      headers: { 'Cache-Control': 'private, max-age=30' },
    };
  } catch (error) {
    context.error('Error fetching boards:', error);
    return { status: 500, jsonBody: { message: 'Failed to fetch boards' } };
  }
}

// Get board by ID
export async function getBoardById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request);
  if (!auth) {
    return { status: 401, jsonBody: { message: 'Authentication required' } };
  }

  const id = request.params.id;
  const container = await getContainer('boards');
  let board: Board | null = null;

  try {
    if (container) {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId',
          parameters: [
            { name: '@id', value: id },
            { name: '@userId', value: auth.id },
          ],
        })
        .fetchAll();
      board = resources[0] || null;
    } else {
      board = (getInMemoryStore('boards').get(id!) as Board) || null;
      if (board && board.userId !== auth.id) board = null;
    }

    if (!board) {
      return { status: 404, jsonBody: { message: 'Board not found' } };
    }

    return {
      status: 200,
      jsonBody: board,
      headers: { 'Cache-Control': 'private, max-age=60' },
    };
  } catch (error) {
    context.error('Error fetching board:', error);
    return { status: 500, jsonBody: { message: 'Failed to fetch board' } };
  }
}

// Get board by share code (public)
export async function getBoardByShareCode(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const shareCode = request.params.shareCode;
  const password = request.query.get('password');
  const container = await getContainer('boards');
  let board: Board | null = null;

  try {
    if (container) {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.shareCode = @shareCode',
          parameters: [{ name: '@shareCode', value: shareCode }],
        })
        .fetchAll();
      board = resources[0] || null;
    } else {
      const store = getInMemoryStore('boards');
      for (const b of store.values()) {
        if ((b as Board).shareCode === shareCode) {
          board = b as Board;
          break;
        }
      }
    }

    if (!board) {
      return { status: 404, jsonBody: { message: 'Board not found' } };
    }

    if (board.expiresAt && new Date(board.expiresAt) < new Date()) {
      return { status: 410, jsonBody: { message: 'This board has expired' } };
    }

    if (board.password && board.password !== password) {
      return { status: 401, jsonBody: { message: 'Password required', requiresPassword: true } };
    }

    const { password: _, ...publicBoard } = board;
    return {
      status: 200,
      jsonBody: publicBoard,
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    };
  } catch (error) {
    context.error('Error fetching board by share code:', error);
    return { status: 500, jsonBody: { message: 'Failed to fetch board' } };
  }
}

// Create board
export async function createBoard(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request);
  if (!auth) {
    return { status: 401, jsonBody: { message: 'Authentication required' } };
  }

  try {
    const body = await request.json() as Partial<Board>;
    const { title, recipientName, occasion } = body;

    if (!title || !recipientName || !occasion) {
      return { status: 400, jsonBody: { message: 'Title, recipient name, and occasion required' } };
    }

    const now = new Date().toISOString();
    const board: Board = {
      id: uuidv4(),
      userId: auth.id,
      title,
      recipientName,
      occasion,
      description: body.description,
      backgroundColor: body.backgroundColor || '#f0f4f8',
      backgroundPattern: body.backgroundPattern,
      isPublic: body.isPublic !== false,
      password: body.password,
      shareCode: generateShareCode(),
      expiresAt: body.expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    const container = await getContainer('boards');
    if (container) {
      await container.items.create(board);
    } else {
      getInMemoryStore('boards').set(board.id, board);
    }

    return {
      status: 201,
      jsonBody: board,
      headers: { 'Cache-Control': 'no-store' },
    };
  } catch (error) {
    context.error('Error creating board:', error);
    return { status: 500, jsonBody: { message: 'Failed to create board' } };
  }
}

// Update board
export async function updateBoard(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request);
  if (!auth) {
    return { status: 401, jsonBody: { message: 'Authentication required' } };
  }

  const id = request.params.id;
  const updates = await request.json() as Partial<Board>;
  const container = await getContainer('boards');

  try {
    let board: Board | null = null;

    if (container) {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId',
          parameters: [
            { name: '@id', value: id },
            { name: '@userId', value: auth.id },
          ],
        })
        .fetchAll();
      board = resources[0] || null;

      if (board) {
        const updatedBoard = { ...board, ...updates, updatedAt: new Date().toISOString() };
        await container.item(id!, auth.id).replace(updatedBoard);
        return { status: 200, jsonBody: updatedBoard };
      }
    } else {
      board = (getInMemoryStore('boards').get(id!) as Board) || null;
      if (board && board.userId === auth.id) {
        const updatedBoard = { ...board, ...updates, updatedAt: new Date().toISOString() };
        getInMemoryStore('boards').set(id!, updatedBoard);
        return { status: 200, jsonBody: updatedBoard };
      }
    }

    return { status: 404, jsonBody: { message: 'Board not found' } };
  } catch (error) {
    context.error('Error updating board:', error);
    return { status: 500, jsonBody: { message: 'Failed to update board' } };
  }
}

// Delete board
export async function deleteBoard(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request);
  if (!auth) {
    return { status: 401, jsonBody: { message: 'Authentication required' } };
  }

  const id = request.params.id;
  const container = await getContainer('boards');

  try {
    if (container) {
      await container.item(id!, auth.id).delete();
    } else {
      getInMemoryStore('boards').delete(id!);
    }
    return { status: 204 };
  } catch (error) {
    context.error('Error deleting board:', error);
    return { status: 500, jsonBody: { message: 'Failed to delete board' } };
  }
}

// Register routes
app.http('boards-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'boards',
  handler: getBoards,
});

app.http('boards-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'boards/{id}',
  handler: getBoardById,
});

app.http('boards-share', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'boards/share/{shareCode}',
  handler: getBoardByShareCode,
});

app.http('boards-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'boards',
  handler: createBoard,
});

app.http('boards-update', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'boards/{id}',
  handler: updateBoard,
});

app.http('boards-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'boards/{id}',
  handler: deleteBoard,
});
