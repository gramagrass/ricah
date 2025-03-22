import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mediaJsonResponse = await fetch(process.env.MEDIA_JSON_BLOB_URL!, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });
    if (!mediaJsonResponse.ok) {
      throw new Error('Failed to fetch media.json');
    }
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
}

interface MediaJson {
  mediaItems: MediaItem[];
  order: string[];
}
