import type { NextApiRequest, NextApiResponse } from 'next';
import { del } from '@vercel/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { url } = req.query;

  if (typeof url !== 'string') {
    return res.status(400).json({ message: 'URL must be a string' });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not set. Please configure it in environment variables.');
    }

    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Delete failed';
    res.status(500).json({ message: errorMessage });
  }
}
