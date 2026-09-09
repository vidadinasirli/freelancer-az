import { Router } from 'express';
import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.join(__dirname, '..', 'data', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
  ['audio/mpeg', '.mp3'],
  ['audio/wav', '.wav'],
  ['application/pdf', '.pdf'],
]);

const cloudinaryConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error('Bu fayl formatı dəstəklənmir. JPG, PNG, WEBP, MP4, WEBM, MP3, WAV və PDF istifadə edin.'));
    }
    callback(null, true);
  },
});

function uploadToCloudinary(file, userId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: `freelancer-az/${userId}`,
      resource_type: 'auto',
      use_filename: false,
      unique_filename: true,
    }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(file.buffer);
  });
}

function saveLocally(file, userId, req) {
  const extension = allowedTypes.get(file.mimetype);
  const filename = `${userId}-${Date.now()}-${crypto.randomUUID()}${extension}`;
  fs.writeFileSync(path.join(uploadDirectory, filename), file.buffer);
  return {
    url: `${req.protocol}://${req.get('host')}/uploads/${filename}`,
    filename,
    mimeType: file.mimetype,
    size: file.size,
    provider: 'local',
  };
}

router.post('/media', requireAuth, upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Yükləmək üçün fayl seçin.' });
  if (cloudinaryConfigured) {
    try {
      const result = await uploadToCloudinary(req.file, req.userId);
      return res.status(201).json({
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: req.file.mimetype,
        size: req.file.size,
        provider: 'cloudinary',
      });
    } catch (error) {
      console.error('Cloudinary upload failed, using local fallback:', error);
    }
  }

  try {
    return res.status(201).json(saveLocally(req.file, req.userId, req));
  } catch (error) {
    return next(error);
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error?.message?.includes('dəstəklənmir')) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

export default router;
