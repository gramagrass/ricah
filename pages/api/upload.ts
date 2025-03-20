import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const isFilesystem = process.env.STORAGE_METHOD === 'filesystem';
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  const form = new formidable.IncomingForm({
    keepExtensions: true,
    uploadDir: isFilesystem ? uploadDir : undefined,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
  } as any);

  try {
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    const file = Array.isArray(files.media) ? files.media[0] : files.media;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let src: string;
    if (isFilesystem) {
      // Local filesystem storage
      await fs.mkdir(uploadDir, { recursive: true });
      src = `/uploads/${file.newFilename}`;
    } else {
      // Vercel Blob storage
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not set. Please configure it in environment variables.');
      }
      const fileBuffer = await fs.readFile(file.filepath);
      const blob = await put(file.originalFilename || file.newFilename, fileBuffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      src = blob.url;
    }

    const newMedia: MediaItem = {
      id: Date.now().toString(),
      src,
      type: file.mimetype?.startsWith('image') ? 'image' : 'video',
      name: file.originalFilename || 'Untitled',
      mtime: new Date().toISOString(),
    };

    console.log('Uploaded file:', newMedia);
    res.status(200).json(newMedia);
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    res.status(500).json({ message: errorMessage });
  }
}

type MediaItem = {
  id: string;
  src: string;
  type: 'image' | 'video';
  name: string;
  mtime: string;
};