import { CosmosClient, Database, Container } from '@azure/cosmos';

let database: Database;
let boardsContainer: Container;
let messagesContainer: Container;
let usersContainer: Container;

export async function initializeDatabase(): Promise<void> {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  const databaseId = process.env.COSMOS_DATABASE || 'kudoboard';

  if (!endpoint || !key) {
    console.warn('⚠️ Cosmos DB credentials not configured. Using in-memory storage for development.');
    return;
  }

  try {
    const client = new CosmosClient({ endpoint, key });

    // Create database if not exists
    const { database: db } = await client.databases.createIfNotExists({
      id: databaseId
    });
    database = db;

    // Create containers with partition keys optimized for our access patterns
    const { container: boards } = await database.containers.createIfNotExists({
      id: 'boards',
      partitionKey: { paths: ['/userId'] }
    });
    boardsContainer = boards;

    const { container: messages } = await database.containers.createIfNotExists({
      id: 'messages',
      partitionKey: { paths: ['/boardId'] }
    });
    messagesContainer = messages;

    const { container: users } = await database.containers.createIfNotExists({
      id: 'users',
      partitionKey: { paths: ['/email'] }
    });
    usersContainer = users;

    console.log('✅ Cosmos DB containers initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Cosmos DB:', error);
    throw error;
  }
}

export function getDatabase(): Database {
  return database;
}

export function getBoardsContainer(): Container {
  return boardsContainer;
}

export function getMessagesContainer(): Container {
  return messagesContainer;
}

export function getUsersContainer(): Container {
  return usersContainer;
}
