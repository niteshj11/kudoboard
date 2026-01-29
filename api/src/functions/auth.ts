import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { getContainer, getInMemoryStore } from '../lib/database.js';
import { generateToken, authenticateRequest } from '../lib/auth.js';
import { User } from '../lib/types.js';
import bcrypt from 'bcryptjs';

// Password hashing using bcryptjs (more portable for serverless)
function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(password: string, storedHash: string): boolean {
  return bcrypt.compareSync(password, storedHash);
}

// Register endpoint
export async function register(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as { email?: string; password?: string; name?: string };
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return { status: 400, jsonBody: { message: 'Email, password, and name required' } };
    }

    if (password.length < 6) {
      return { status: 400, jsonBody: { message: 'Password must be at least 6 characters' } };
    }

    const container = await getContainer('users');
    let existingUser: User | null = null;

    if (container) {
      const { resources } = await container.items
        .query({ query: 'SELECT * FROM c WHERE c.email = @email', parameters: [{ name: '@email', value: email }] })
        .fetchAll();
      existingUser = resources[0] || null;
    } else {
      const store = getInMemoryStore('users');
      for (const user of store.values()) {
        if ((user as User).email === email) {
          existingUser = user as User;
          break;
        }
      }
    }

    if (existingUser) {
      return { status: 409, jsonBody: { message: 'Email already registered' } };
    }

    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();
    const user: User = {
      id: uuidv4(),
      email,
      name,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    if (container) {
      // Document already has the partition key (email) as a property
      await container.items.create(user);
    } else {
      getInMemoryStore('users').set(user.id, user);
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    return {
      status: 201,
      jsonBody: { user: userWithoutPassword, token },
      headers: { 'Cache-Control': 'no-store' },
    };
  } catch (error) {
    context.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { status: 500, jsonBody: { message: 'Registration failed', error: errorMessage } };
  }
}

// Login endpoint
export async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return { status: 400, jsonBody: { message: 'Email and password required' } };
    }

    const container = await getContainer('users');
    let user: User | null = null;

    if (container) {
      const { resources } = await container.items
        .query({ query: 'SELECT * FROM c WHERE c.email = @email', parameters: [{ name: '@email', value: email }] })
        .fetchAll();
      user = resources[0] || null;
    } else {
      const store = getInMemoryStore('users');
      for (const u of store.values()) {
        if ((u as User).email === email) {
          user = u as User;
          break;
        }
      }
    }

    if (!user || !user.passwordHash) {
      return { status: 401, jsonBody: { message: 'Invalid email or password' } };
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { status: 401, jsonBody: { message: 'Invalid email or password' } };
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    return {
      status: 200,
      jsonBody: { user: userWithoutPassword, token },
      headers: { 'Cache-Control': 'no-store' },
    };
  } catch (error) {
    context.error('Login error:', error);
    return { status: 500, jsonBody: { message: 'Login failed' } };
  }
}

// Get current user
export async function me(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const auth = authenticateRequest(request);
  if (!auth) {
    return { status: 401, jsonBody: { message: 'Authentication required' } };
  }
  return {
    status: 200,
    jsonBody: { user: auth },
    headers: { 'Cache-Control': 'private, max-age=60' },
  };
}

// Register routes
app.http('auth-register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: register,
});

app.http('auth-login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login,
});

app.http('auth-me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: me,
});
