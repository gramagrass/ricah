import { NextApiRequest, NextApiResponse } from 'next';
import { get, BlobGetResult } from '@vercel/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mediaJsonResponse: BlobGetResult = await get(process.env.MEDIA_JSON_BLOB_URL!, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const mediaJson: MediaJson = await mediaJsonResponse.json();
    return res.status(200).json(mediaJson.mediaItems);
  } catch (error) {
    console.error('Error fetching media items:', error);
    return res.status(500).json({ error: 'Error fetching media items' });
  }
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

interface MediaJson {
  mediaItems: MediaItem[];
  order: string[];
}
