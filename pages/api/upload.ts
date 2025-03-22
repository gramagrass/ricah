import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import formidable from 'formidable';
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

  const form = new formidable.IncomingForm({
    keepExtensions: true,
    multiples: true,
  });

  try {
    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    });

    console.log('Parsed fields:', fields);
    console.log('Parsed files:', Object.keys(files));

    const mediaFile = Array.isArray(files.media) ? files.media[0] : files.media;

    if (!mediaFile) {
      console.error('No media file uploaded');
      return res.status(400).json({ error: 'No media file uploaded' });
    }

    // Log media file details
    console.log('Media file details:', {
      originalFilename: mediaFile.originalFilename,
      mimetype: mediaFile.mimetype,
      size: mediaFile.size,
      filepath: mediaFile.filepath,
    });

    // Read the file content from the temporary filepath
    const mediaFileContent = await fs.readFile(mediaFile.filepath);
    if (!mediaFileContent || mediaFileContent.length === 0) {
      console.error('Media file content is empty after reading');
      return res.status(400).json({ error: 'Media file content is empty' });
    }
    console.log('Media file content size:', mediaFileContent.length);

    // Convert Buffer to ReadableStream for Vercel Blob
    const mediaStream = new ReadableStream({
      start(controller) {
        controller.enqueue(mediaFileContent);
        controller.close();
      },
    });

    // Upload the main media file to Vercel Blob
    const mediaBlob = await put(mediaFile.originalFilename || 'unnamed', mediaStream, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log('Media file uploaded to:', mediaBlob.url);

    const mediaItem: MediaItem = {
      id: mediaBlob.pathname,
      src: mediaBlob.url,
      type: mediaFile.mimetype?.includes('video') ? 'video' : 'image',
      name: mediaFile.originalFilename || 'unnamed',
      mtime: new Date().toISOString(),
    };

    // Fetch the current media.json from Vercel Blob
    const mediaJsonResponse = await fetch(process.env.MEDIA_JSON_BLOB_URL!, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });
    if (!mediaJsonResponse.ok) {
      const errorText = await mediaJsonResponse.text();
      console.error('Failed to fetch media.json:', errorText);
      throw new Error(`Failed to fetch media.json: ${errorText}`);
    }
    const mediaJson: MediaJson = await mediaJsonResponse.json();
    console.log('Fetched media.json:', mediaJson);

    mediaJson.mediaItems.push(mediaItem);
    mediaJson.order.push(mediaItem.id);
    console.log('Updated media.json:', mediaJson);

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
    console.log('media.json updated successfully');

    return res.status(200).json({ message: 'Media uploaded successfully', mediaItem });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return res.status(500).json({ error: 'Error uploading media' });
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
