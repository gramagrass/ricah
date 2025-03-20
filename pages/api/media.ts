import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { list } from '@vercel/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isFilesystem = process.env.STORAGE_METHOD === 'filesystem';
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  try {
    let mediaItems: MediaItem[];
    if (isFilesystem) {
      // Local filesystem
      await fs.mkdir(uploadDir, { recursive: true });
      const files = await fs.readdir(uploadDir);
      mediaItems = await Promise.all(
        files.map(async (file, index) => {
          const filePath = path.join(uploadDir, file);
          const stats = await fs.stat(filePath);
          const isImage = file.match(/\.(jpg|jpeg|png|gif)$/i);
          return {
            id: `${index}-${Date.now()}`,
            src: `/uploads/${file}`,
            type: isImage ? 'image' : 'video',
            name: file,
            mtime: stats.mtime.toISOString(),
          };
        })
      );
    } else {
      // Vercel Blob
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not set. Please configure it in environment variables.');
      }
      console.log('Fetching blobs from Vercel Blob...');
      const { blobs } = await list({
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log('Blobs fetched:', blobs);
      mediaItems = blobs.map((blob, index) => ({
        id: `${index}-${blob.pathname}`,
        src: blob.url,
        type: blob.pathname.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 'video',
        name: blob.pathname,
        mtime: new Date(blob.uploadedAt).toISOString(),
      }));
      console.log('Media items mapped:', mediaItems);

      // Sort by mtime
      mediaItems.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());
      console.log('Media items after mtime sort:', mediaItems);
    }

    res.status(200).json(mediaItems);
  } catch (error) {
    console.error('Error reading media:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching media';
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
