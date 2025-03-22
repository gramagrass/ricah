import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch the current media.json from Vercel Blob
    const mediaJsonResponse = await fetch(process.env.MEDIA_JSON_BLOB_URL!, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });
    if (!mediaJsonResponse.ok) {
      throw new Error('Failed to fetch media.json');
    }
    const mediaJson: MediaJson = await mediaJsonResponse.json();

    if (req.method === 'GET') {
      return res.status(200).json({ order: mediaJson.order });
    }

    if (req.method === 'POST') {
      const { order } = req.body;
      if (!Array.isArray(order)) {
        return res.status(400).json({ error: 'Order must be an array' });
      }

      // Update the order in media.json
      mediaJson.order = order;

      // Write the updated media.json back to Vercel Blob
      const mediaJsonContent = JSON.stringify(mediaJson, null, 2);
      const mediaJsonStream = new ReadableStream({
        start(controller) {
          controller.enqueue(Buffer.from(mediaJsonContent));
          controller.close();
        },
      });
      await put('media.json', mediaJsonStream, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return res.status(200).json({ message: 'Order updated successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling order:', error);
    return res.status(500).json({ error: 'Error handling order' });
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
