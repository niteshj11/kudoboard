import { CosmosClient, Database, Container } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';

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

  if (!endpoint) {
    console.warn('Cosmos DB endpoint not configured, using in-memory storage');
    return null;
  }

  // Use key-based auth if key is provided, otherwise use Managed Identity
  if (key) {
    console.log('Using Cosmos DB with key-based authentication');
    client = new CosmosClient({ endpoint, key });
  } else {
    console.log('Using Cosmos DB with Managed Identity (DefaultAzureCredential)');
    const credential = new DefaultAzureCredential();
    client = new CosmosClient({ endpoint, aadCredentials: credential });
  }
  
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
