import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { put, get, BlobGetResult } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm({
    keepExtensions: true,
    fileWriteStreamHandler: undefined,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const mediaFile = Array.isArray(files.media) ? files.media[0] : files.media;
    const linkedMediaFile = Array.isArray(files.linkedMedia) ? files.linkedMedia[0] : files.linkedMedia;
    const linkedMediaUrl = Array.isArray(fields.linkedMediaUrl) ? fields.linkedMediaUrl[0] : fields.linkedMediaUrl;

    if (!mediaFile) {
      return res.status(400).json({ error: 'No media file uploaded' });
    }

    try {
      // Upload the main media file to Vercel Blob
      const mediaFileContent = mediaFile._buf || Buffer.from('');
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
        const linkedMediaFileContent = linkedMediaFile._buf || Buffer.from('');
        const pdfBlob = await put(linkedMediaFile.originalFilename || 'unnamed.pdf', linkedMediaFileContent, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        mediaItem.linkedMedia = { type: 'pdf', url: pdfBlob.url };
      } else if (linkedMediaUrl) {
        mediaItem.linkedMedia = { type: 'link', url: linkedMediaUrl };
      }

      // Fetch the current media.json from Vercel Blob
      const mediaJsonResponse: BlobGetResult = await get(process.env.MEDIA_JSON_BLOB_URL!, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const mediaJson: MediaJson = await mediaJsonResponse.json();

      // Update the media items and order
      mediaJson.mediaItems.push(mediaItem);
      mediaJson.order.push(mediaItem.id);

      // Write the updated media.json back to Vercel Blob
      await put('media.json', JSON.stringify(mediaJson, null, 2), {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

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

interface MediaJson {
  mediaItems: MediaItem[];
  order: string[];
}
