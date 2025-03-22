import { NextApiRequest, NextApiResponse } from 'next';
import { del } from '@vercel/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (typeof url !== 'string') {
    return res.status(400).json({ error: 'URL must be a string' });
  }

  try {
    // Delete the media file from Vercel Blob
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });

    return res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    return res.status(500).json({ error: 'Error deleting media' });
  }
}
