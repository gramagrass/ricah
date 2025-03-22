import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching media.json from:', process.env.MEDIA_JSON_BLOB_URL);
    console.log('Using token:', process.env.BLOB_READ_WRITE_TOKEN ? 'Token present' : 'Token missing');

    const mediaJsonResponse = await fetch(process.env.MEDIA_JSON_BLOB_URL!, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    console.log('Fetch response status:', mediaJsonResponse.status);
    if (!mediaJsonResponse.ok) {
      const errorText = await mediaJsonResponse.text();
      console.error('Failed to fetch media.json:', errorText);
      throw new Error(`Failed to fetch media.json: ${errorText}`);
    }

    const mediaJson: MediaJson = await mediaJsonResponse.json();
    console.log('Fetched media.json:', mediaJson);

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
