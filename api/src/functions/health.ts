import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

// Health check endpoint - optimized for fast response
export async function health(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  return {
    status: 200,
    jsonBody: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      region: process.env.REGION_NAME || 'unknown',
    },
    headers: {
      'Cache-Control': 'no-cache',
    },
  };
}

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: health,
});
