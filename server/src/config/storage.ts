import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import * as fs from 'fs';
import * as path from 'path';

let containerClient: ContainerClient | null = null;

// Local uploads directory for development
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

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
  } else {
    // Initialize local uploads directory for development
    initializeLocalStorage();
  }
}

function initializeLocalStorage(): void {
  const imagesDir = path.join(UPLOADS_DIR, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('✅ Local uploads directory created:', imagesDir);
  }
}

export async function uploadBlob(
  blobName: string,
  data: Buffer,
  contentType: string
): Promise<string | null> {
  const client = getStorageClient();
  
  if (!client) {
    // For development, save to local filesystem
    try {
      const filePath = path.join(UPLOADS_DIR, blobName);
      const dir = path.dirname(filePath);
      
      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save file
      fs.writeFileSync(filePath, data);
      console.log('✅ File saved locally:', filePath);
      
      // Return URL path that can be served
      return `/uploads/${blobName}`;
    } catch (error) {
      console.error('❌ Failed to save file locally:', error);
      return null;
    }
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
