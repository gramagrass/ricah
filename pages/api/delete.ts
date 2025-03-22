import { NextApiRequest, NextApiResponse } from 'next';
import { del, put } from '@vercel/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (typeof url !== 'string') {
    return res.status(400).json({ error: 'URL must be a string' });
  }

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

    // Find the media item to delete
    const mediaItem = mediaJson.mediaItems.find((item) => item.src === url);
    if (!mediaItem) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    // Delete the media file from Vercel Blob
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });

    // If the media item has a linked PDF, delete that too
    if (mediaItem.linkedMedia && mediaItem.linkedMedia.type === 'pdf') {
      await del(mediaItem.linkedMedia.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }

    // Remove the media item from media.json
    mediaJson.mediaItems = mediaJson.mediaItems.filter((item) => item.src !== url);
    mediaJson.order = mediaJson.order.filter((id) => id !== mediaItem.id);

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

    return res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    return res.status(500).json({ error: 'Error deleting media' });
  }
}

interface MediaJson {
  mediaItems: MediaItem[];
  order: string[];
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
