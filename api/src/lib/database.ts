import { CosmosClient, Database, Container } from '@azure/cosmos';

let client: CosmosClient | null = null;
let database: Database | null = null;

// In-memory fallback for development
const inMemoryData = {
  users: new Map<string, unknown>(),
  boards: new Map<string, unknown>(),
  messages: new Map<string, unknown>(),
};

export function getCosmosClient(): CosmosClient | null {
  if (client) return client;

  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    console.warn('Cosmos DB not configured, using in-memory storage');
    return null;
  }

  client = new CosmosClient({ endpoint, key });
  return client;
}

export async function getDatabase(): Promise<Database | null> {
  if (database) return database;

  const cosmosClient = getCosmosClient();
  if (!cosmosClient) return null;

  const databaseId = process.env.COSMOS_DATABASE || 'kudoboard';
  const { database: db } = await cosmosClient.databases.createIfNotExists({ id: databaseId });
  database = db;
  return database;
}

export async function getContainer(containerId: string): Promise<Container | null> {
  const db = await getDatabase();
  if (!db) return null;
  return db.container(containerId);
}

export function getInMemoryStore(collection: 'users' | 'boards' | 'messages') {
  return inMemoryData[collection];
}
