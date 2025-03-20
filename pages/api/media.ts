import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { list } from '@vercel/blob';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client using KV_* variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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

      // Apply custom order from Upstash KV
      console.log('Fetching order from Upstash KV...');
      const order: string[] | null = await redis.get('media-order');
      console.log('Order fetched:', order);
      if (order) {
        mediaItems = mediaItems.sort((a, b) => {
          const aIndex = order.indexOf(a.id);
          const bIndex = order.indexOf(b.id);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        console.log('Media items after custom order:', mediaItems);
      } else {
        // Default to sorting by mtime if no custom order
        mediaItems.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());
        console.log('Media items after mtime sort:', mediaItems);
      }
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
