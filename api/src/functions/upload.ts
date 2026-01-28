import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { uploadBlob } from '../lib/storage.js';

// Upload image
export async function uploadImage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return { status: 400, jsonBody: { message: 'No file uploaded' } };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { status: 400, jsonBody: { message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' } };
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { status: 400, jsonBody: { message: 'File too large. Maximum size is 5MB.' } };
    }

    const extension = file.type.split('/')[1];
    const blobName = `images/${uuidv4()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadBlob(blobName, buffer, file.type);

    if (!url) {
      return { status: 500, jsonBody: { message: 'Failed to upload image' } };
    }

    return {
      status: 200,
      jsonBody: { url },
      headers: { 'Cache-Control': 'no-store' },
    };
  } catch (error) {
    context.error('Upload error:', error);
    return { status: 500, jsonBody: { message: 'Failed to upload image' } };
  }
}

// Register route
app.http('upload-image', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'upload/image',
  handler: uploadImage,
});
