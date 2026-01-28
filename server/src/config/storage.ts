import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

let containerClient: ContainerClient | null = null;

export function getStorageClient(): ContainerClient | null {
  if (containerClient) {
    return containerClient;
  }

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER || 'kudoboard-images';

  if (!connectionString) {
    console.warn('⚠️ Azure Storage not configured. File uploads will use local storage.');
    return null;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
    return containerClient;
  } catch (error) {
    console.error('❌ Failed to initialize Azure Storage:', error);
    return null;
  }
}

export async function initializeStorage(): Promise<void> {
  const client = getStorageClient();
  if (client) {
    await client.createIfNotExists({
      access: 'blob' // Public read access for blobs
    });
    console.log('✅ Azure Blob Storage initialized');
  }
}

export async function uploadBlob(
  blobName: string,
  data: Buffer,
  contentType: string
): Promise<string | null> {
  const client = getStorageClient();
  
  if (!client) {
    // For development, return a placeholder
    return `/uploads/${blobName}`;
  }

  try {
    const blockBlobClient = client.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(data, {
      blobHTTPHeaders: { blobContentType: contentType }
    });
    return blockBlobClient.url;
  } catch (error) {
    console.error('❌ Failed to upload blob:', error);
    return null;
  }
}

export async function deleteBlob(blobName: string): Promise<boolean> {
  const client = getStorageClient();
  
  if (!client) {
    return true;
  }

  try {
    const blockBlobClient = client.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
    return true;
  } catch (error) {
    console.error('❌ Failed to delete blob:', error);
    return false;
  }
}
