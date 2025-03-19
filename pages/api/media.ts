import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type MediaItem = {
  id: string;
  src: string;
  type: 'image' | 'video';
  name: string;
  mtime: string; // Modification time for sorting by date
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const mediaDir = path.join(process.cwd(), 'public/media');
  try {
    const files = fs.readdirSync(mediaDir);
    const mediaItems: MediaItem[] = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.mp4'].includes(ext);
      })
      .map((file) => {
        const stats = fs.statSync(path.join(mediaDir, file));
        const ext = path.extname(file).toLowerCase();
        return {
          id: file,
          src: `/media/${file}`,
          type: ['.mp4'].includes(ext) ? 'video' : 'image',
          name: file,
          mtime: stats.mtime.toISOString(),
        };
      });

    res.status(200).json(mediaItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load media files' });
  }
}