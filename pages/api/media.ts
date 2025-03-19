import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  try {
    // Check if directory exists, create if not
    await fs.mkdir(uploadDir, { recursive: true });

    // Read files from uploads directory
    const files = await fs.readdir(uploadDir);
    const mediaItems: MediaItem[] = await Promise.all(
      files.map(async (file, index) => {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.stat(filePath); // Use async stat
        const isImage = file.match(/\.(jpg|jpeg|png|gif)$/i);

        return {
          id: `${index}-${Date.now()}`, // Temporary ID
          src: `/uploads/${file}`,
          type: isImage ? 'image' : 'video',
          name: file,
          mtime: stats.mtime.toISOString(),
        };
      })
    );

    res.status(200).json(mediaItems);
  } catch (error) {
    console.error('Error reading media:', error);
    res.status(500).json({ message: 'Error fetching media' });
  }
}

type MediaItem = {
  id: string;
  src: string;
  type: 'image' | 'video';
  name: string;
  mtime: string;
};