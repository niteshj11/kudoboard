import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

// Mock GIF data for development
function getMockGifs(query: string) {
  const mockUrls = [
    'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
    'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif',
  ];

  return mockUrls.map((url, i) => ({
    id: `mock-${i}`,
    title: `${query} gif ${i + 1}`,
    images: {
      fixed_height: { url, width: '200', height: '200' },
      fixed_width: { url, width: '200', height: '200' },
      original: { url, width: '480', height: '480' },
      preview_gif: { url },
    },
  }));
}

// Search GIFs
export async function searchGifs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const q = request.query.get('q');
  const limit = request.query.get('limit') || '20';
  const offset = request.query.get('offset') || '0';

  if (!q) {
    return { status: 400, jsonBody: { message: 'Search query required' } };
  }

  // Use mock data if no API key
  if (!GIPHY_API_KEY) {
    const mockGifs = getMockGifs(q);
    return {
      status: 200,
      jsonBody: { data: mockGifs, pagination: { total_count: mockGifs.length, count: mockGifs.length, offset: 0 } },
      headers: { 'Cache-Control': 'public, max-age=300' },
    };
  }

  try {
    const url = `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&rating=g`;
    const response = await fetch(url);
    const data = await response.json();

    return {
      status: 200,
      jsonBody: data,
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    };
  } catch (error) {
    context.error('Giphy API error:', error);
    return { status: 500, jsonBody: { message: 'Failed to search GIFs' } };
  }
}

// Trending GIFs
export async function trendingGifs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const limit = request.query.get('limit') || '20';
  const offset = request.query.get('offset') || '0';

  if (!GIPHY_API_KEY) {
    const mockGifs = getMockGifs('trending');
    return {
      status: 200,
      jsonBody: { data: mockGifs, pagination: { total_count: mockGifs.length, count: mockGifs.length, offset: 0 } },
      headers: { 'Cache-Control': 'public, max-age=300' },
    };
  }

  try {
    const url = `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`;
    const response = await fetch(url);
    const data = await response.json();

    return {
      status: 200,
      jsonBody: data,
      headers: { 'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800' },
    };
  } catch (error) {
    context.error('Giphy API error:', error);
    return { status: 500, jsonBody: { message: 'Failed to fetch trending GIFs' } };
  }
}

// Register routes
app.http('giphy-search', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'giphy/search',
  handler: searchGifs,
});

app.http('giphy-trending', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'giphy/trending',
  handler: trendingGifs,
});
