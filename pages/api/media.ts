import { NextApiRequest, NextApiResponse } from 'next';
import { list } from '@vercel/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Filter out blobs in the "assets" subfolder
    const mediaBlobs = blobs.filter((blob) => !blob.pathname.startsWith('assets/'));

    const mediaItems = mediaBlobs.map((blob) => ({
      id: blob.pathname,
      src: blob.url,
      type: blob.pathname.endsWith('.mp4') || blob.pathname.endsWith('.webm') ? 'video' : 'image',
      name: blob.pathname,
      mtime: new Date(blob.uploadedAt).toISOString(),
    }));

    return res.status(200).json(mediaItems);
  } catch (error) {
    console.error('Error listing media items:', error);
    return res.status(500).json({ error: 'Error listing media items' });
  }
}
