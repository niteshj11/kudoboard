import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

let containerClient: ContainerClient | null = null;

export function getStorageClient(): ContainerClient | null {
  if (containerClient) return containerClient;

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER || 'kudoboard-images';

  if (!connectionString) {
    console.warn('Azure Storage not configured');
    return null;
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
  return containerClient;
}

export async function uploadBlob(
  blobName: string,
  data: Buffer,
  contentType: string
): Promise<string | null> {
  const client = getStorageClient();
  if (!client) return `/uploads/${blobName}`;

  try {
    const blockBlobClient = client.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(data, {
      blobHTTPHeaders: { blobContentType: contentType }
    });
    return blockBlobClient.url;
  } catch (error) {
    console.error('Failed to upload blob:', error);
    return null;
  }
}
