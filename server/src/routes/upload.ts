import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { uploadBlob } from '../config/storage';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { sendErrorResponse } from '../utils/errorResponse';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (for GIFs)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Upload image
router.post('/image', optionalAuth, upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }

  try {
    const extension = req.file.mimetype.split('/')[1];
    const blobName = `images/${uuidv4()}.${extension}`;
    
    const url = await uploadBlob(blobName, req.file.buffer, req.file.mimetype);
    
    if (!url) {
      res.status(500).json({ message: 'Failed to upload image' });
      return;
    }

    res.json({ url });
  } catch (error) {
    sendErrorResponse(res, error, 'Uploading image');
  }
});

export default router;
