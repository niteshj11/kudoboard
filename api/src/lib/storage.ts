import { BlobServiceClient, ContainerClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';

let containerClient: ContainerClient | null = null;
let sharedKeyCredential: StorageSharedKeyCredential | null = null;
let accountName: string | null = null;

export function getStorageClient(): ContainerClient | null {
  if (containerClient) return containerClient;

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER || 'kudoboard-images';

  if (!connectionString) {
    console.warn('Azure Storage not configured');
    return null;
  }

  // Parse connection string to get account name and key for SAS generation
  const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
  const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
  
  if (accountNameMatch && accountKeyMatch) {
    accountName = accountNameMatch[1];
    sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKeyMatch[1]);
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
  return containerClient;
}

// Generate a SAS URL for a blob that expires in 1 year
function generateSasUrl(blobName: string): string | null {
  if (!sharedKeyCredential || !accountName || !containerClient) {
    return null;
  }

  const containerName = process.env.AZURE_STORAGE_CONTAINER || 'kudoboard-images';
  
  // SAS token valid for 1 year
  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + 1);

  const sasToken = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('r'), // Read only
    expiresOn,
  }, sharedKeyCredential).toString();

  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
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
    
    // Return SAS URL instead of direct blob URL
    const sasUrl = generateSasUrl(blobName);
    return sasUrl || blockBlobClient.url;
  } catch (error) {
    console.error('Failed to upload blob:', error);
    return null;
  }
}
