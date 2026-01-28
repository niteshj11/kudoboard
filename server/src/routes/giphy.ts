import { Router, Response, Request } from 'express';

const router = Router();

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

// Search GIFs
router.get('/search', async (req: Request, res: Response) => {
  const { q, limit = 20, offset = 0 } = req.query;

  if (!q) {
    res.status(400).json({ message: 'Search query required' });
    return;
  }

  // If no API key, return mock data for development
  if (!GIPHY_API_KEY) {
    const mockGifs = getMockGifs(String(q));
    res.json({ data: mockGifs, pagination: { total_count: mockGifs.length, count: mockGifs.length, offset: 0 } });
    return;
  }

  try {
    const url = `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(String(q))}&limit=${limit}&offset=${offset}&rating=g`;
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Giphy API error:', error);
    res.status(500).json({ message: 'Failed to search GIFs' });
  }
});

// Trending GIFs
router.get('/trending', async (req: Request, res: Response) => {
  const { limit = 20, offset = 0 } = req.query;

  if (!GIPHY_API_KEY) {
    const mockGifs = getMockGifs('trending');
    res.json({ data: mockGifs, pagination: { total_count: mockGifs.length, count: mockGifs.length, offset: 0 } });
    return;
  }

  try {
    const url = `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`;
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Giphy API error:', error);
    res.status(500).json({ message: 'Failed to fetch trending GIFs' });
  }
});

// Mock GIF data for development
function getMockGifs(query: string) {
  const mockUrls = [
    'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
    'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif'
  ];

  return mockUrls.map((url, i) => ({
    id: `mock-${i}`,
    title: `${query} gif ${i + 1}`,
    images: {
      fixed_height: { url, width: '200', height: '200' },
      fixed_width: { url, width: '200', height: '200' },
      original: { url, width: '480', height: '480' },
      preview_gif: { url }
    }
  }));
}

export default router;
