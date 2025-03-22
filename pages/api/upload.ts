import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { put } from '@vercel/blob';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const mediaFile = files.media as formidable.File;
    const linkedMediaFile = files.linkedMedia as formidable.File;
    const linkedMediaUrl = fields.linkedMediaUrl as string;

    if (!mediaFile) {
      return res.status(400).json({ error: 'No media file uploaded' });
    }

    try {
      // Read the media file content into memory
      const mediaFileContent = await fs.readFile(mediaFile.filepath);

      // Upload the main media file (image or video) to Vercel Blob
      const mediaBlob = await put(mediaFile.originalFilename || 'unnamed', mediaFileContent, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      const mediaItem: MediaItem = {
        id: mediaBlob.pathname,
        src: mediaBlob.url,
        type: mediaFile.mimetype?.includes('video') ? 'video' : 'image',
        name: mediaFile.originalFilename || 'unnamed',
        mtime: new Date().toISOString(),
      };

      // Handle linked media (PDF or URL)
      if (linkedMediaFile) {
        // Read the linked media file content into memory
        const linkedMediaFileContent = await fs.readFile(linkedMediaFile.filepath);
        // Upload the PDF to Vercel Blob
        const pdfBlob = await put(linkedMediaFile.originalFilename || 'unnamed.pdf', linkedMediaFileContent, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        mediaItem.linkedMedia = { type: 'pdf', url: pdfBlob.url };
      } else if (linkedMediaUrl) {
        // Store the outbound link
        mediaItem.linkedMedia = { type: 'link', url: linkedMediaUrl };
      }

      // Update the order in the database (using Upstash Redis)
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      const order = (await redis.get<string[]>('media-order')) || [];
      order.push(mediaItem.id);
      await redis.set('media-order', order);

      // Store the media item metadata in Redis
      const mediaItems = (await redis.get<MediaItem[]>('media-items')) || [];
      mediaItems.push(mediaItem);
      await redis.set('media-items', mediaItems);

      return res.status(200).json({ message: 'Media uploaded successfully', mediaItem });
    } catch (error) {
      console.error('Error uploading to Vercel Blob:', error);
      return res.status(500).json({ error: 'Error uploading media' });
    }
  });
}

interface MediaItem {
  id: string;
  src: string;
  type: 'image' | 'video';
  name: string;
  mtime: string;
  linkedMedia?: {
    type: 'pdf' | 'link';
    url: string;
  };
}
