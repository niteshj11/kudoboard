import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { getContainer, getInMemoryStore } from '../lib/database.js';
import { authenticateRequest } from '../lib/auth.js';
import { Message } from '../lib/types.js';

// Get messages for a board
export async function getMessages(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const boardId = request.params.boardId;
  const container = await getContainer('messages');

  try {
    let messages: Message[] = [];

    if (container) {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.boardId = @boardId ORDER BY c.createdAt ASC',
          parameters: [{ name: '@boardId', value: boardId }],
        })
        .fetchAll();
      messages = resources;
    } else {
      const store = getInMemoryStore('messages');
      messages = Array.from(store.values())
        .filter((m) => (m as Message).boardId === boardId)
        .sort((a, b) => new Date((a as Message).createdAt).getTime() - new Date((b as Message).createdAt).getTime()) as Message[];
    }

    return {
      status: 200,
      jsonBody: messages,
      headers: { 
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=60',
      },
    };
  } catch (error) {
    context.error('Error fetching messages:', error);
    return { status: 500, jsonBody: { message: 'Failed to fetch messages' } };
  }
}

// Create message
export async function createMessage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as Partial<Message> & { boardId: string; authorName: string; content: string };
    const { boardId, authorName, content } = body;

    if (!boardId || !authorName || !content) {
      return { status: 400, jsonBody: { message: 'Board ID, author name, and content required' } };
    }

    // Get user email if authenticated
    const auth = authenticateRequest(request);

    const positionX = body.positionX ?? Math.random() * 80 + 10;
    const positionY = body.positionY ?? Math.random() * 60 + 20;
    const rotation = body.rotation ?? (Math.random() - 0.5) * 10;

    const now = new Date().toISOString();
    const message: Message = {
      id: uuidv4(),
      boardId,
      authorName,
      authorEmail: body.authorEmail || auth?.email,
      content,
      imageUrl: body.imageUrl,
      gifUrl: body.gifUrl,
      cardColor: body.cardColor || '#ffffff',
      cardStyle: body.cardStyle || 'default',
      positionX,
      positionY,
      rotation,
      createdAt: now,
      updatedAt: now,
    };

    const container = await getContainer('messages');
    if (container) {
      await container.items.create(message);
    } else {
      getInMemoryStore('messages').set(message.id, message);
    }

    return {
      status: 201,
      jsonBody: message,
      headers: { 'Cache-Control': 'no-store' },
    };
  } catch (error) {
    context.error('Error creating message:', error);
    return { status: 500, jsonBody: { message: 'Failed to create message' } };
  }
}

// Update message
export async function updateMessage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id;
  const updates = await request.json() as Partial<Message>;
  const container = await getContainer('messages');

  try {
    let message: Message | null = null;

    if (container) {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id',
          parameters: [{ name: '@id', value: id }],
        })
        .fetchAll();
      message = resources[0] || null;

      if (message) {
        const updated = { ...message, ...updates, updatedAt: new Date().toISOString() };
        await container.item(id!, message.boardId).replace(updated);
        return { status: 200, jsonBody: updated };
      }
    } else {
      message = (getInMemoryStore('messages').get(id!) as Message) || null;
      if (message) {
        const updated = { ...message, ...updates, updatedAt: new Date().toISOString() };
        getInMemoryStore('messages').set(id!, updated);
        return { status: 200, jsonBody: updated };
      }
    }

    return { status: 404, jsonBody: { message: 'Message not found' } };
  } catch (error) {
    context.error('Error updating message:', error);
    return { status: 500, jsonBody: { message: 'Failed to update message' } };
  }
}

// Update message position
export async function updateMessagePosition(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id;
  const body = await request.json() as { positionX?: number; positionY?: number; rotation?: number };
  const container = await getContainer('messages');

  try {
    let message: Message | null = null;

    if (container) {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id',
          parameters: [{ name: '@id', value: id }],
        })
        .fetchAll();
      message = resources[0] || null;

      if (message) {
        const updated = {
          ...message,
          positionX: body.positionX ?? message.positionX,
          positionY: body.positionY ?? message.positionY,
          rotation: body.rotation ?? message.rotation,
          updatedAt: new Date().toISOString(),
        };
        await container.item(id!, message.boardId).replace(updated);
        return { status: 200, jsonBody: updated };
      }
    } else {
      message = (getInMemoryStore('messages').get(id!) as Message) || null;
      if (message) {
        const updated = {
          ...message,
          positionX: body.positionX ?? message.positionX,
          positionY: body.positionY ?? message.positionY,
          rotation: body.rotation ?? message.rotation,
          updatedAt: new Date().toISOString(),
        };
        getInMemoryStore('messages').set(id!, updated);
        return { status: 200, jsonBody: updated };
      }
    }

    return { status: 404, jsonBody: { message: 'Message not found' } };
  } catch (error) {
    context.error('Error updating message position:', error);
    return { status: 500, jsonBody: { message: 'Failed to update message' } };
  }
}

// Delete message
export async function deleteMessage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id;
  const container = await getContainer('messages');

  try {
    let message: Message | null = null;

    if (container) {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id',
          parameters: [{ name: '@id', value: id }],
        })
        .fetchAll();
      message = resources[0] || null;

      if (message) {
        await container.item(id!, message.boardId).delete();
        return { status: 204 };
      }
    } else {
      message = (getInMemoryStore('messages').get(id!) as Message) || null;
      if (message) {
        getInMemoryStore('messages').delete(id!);
        return { status: 204 };
      }
    }

    return { status: 404, jsonBody: { message: 'Message not found' } };
  } catch (error) {
    context.error('Error deleting message:', error);
    return { status: 500, jsonBody: { message: 'Failed to delete message' } };
  }
}

// Register routes
app.http('messages-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'messages/board/{boardId}',
  handler: getMessages,
});

app.http('messages-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'messages',
  handler: createMessage,
});

app.http('messages-update', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'messages/{id}',
  handler: updateMessage,
});

app.http('messages-position', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'messages/{id}/position',
  handler: updateMessagePosition,
});

app.http('messages-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'messages/{id}',
  handler: deleteMessage,
});
