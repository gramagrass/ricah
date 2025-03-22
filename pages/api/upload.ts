import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { parseFormData } from 'parse-multipart-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the request body as a Buffer
    const body = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    // Parse the multipart form data
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      console.error('No boundary found in Content-Type header');
      return res.status(400).json({ error: 'Invalid Content-Type header' });
    }

    const parts = parseFormData(body, boundary);
    console.log('Parsed form parts:', parts);

    let mediaFileContent: Buffer | null = null;
    let mediaFileName: string | null = null;
    let mediaFileType: string | null = null;
    let linkedMediaFileContent: Buffer | null = null;
    let linkedMediaFileName: string | null = null;
    let linkedMediaUrl: string | null = null;

    for (const part of parts) {
      if (part.name === 'media' && part.data) {
        mediaFileContent = part.data;
        mediaFileName = part.filename || 'unnamed';
        mediaFileType = part.type || 'application/octet-stream';
      } else if (part.name === 'linkedMedia' && part.data) {
        linkedMediaFileContent = part.data;
        linkedMediaFileName = part.filename || 'unnamed.pdf';
      } else if (part.name === 'linkedMediaUrl' && part.data) {
        linkedMediaUrl = part.data.toString();
      }
    }

    if (!mediaFileContent || mediaFileContent.length === 0) {
      console.error('Media file content is empty');
      return res.status(400).json({ error: 'Media file content is empty' });
    }
    console.log('Media file:', { name: mediaFileName, type: mediaFileType, size: mediaFileContent.length });

    // Convert Buffer to ReadableStream for Vercel Blob
    const mediaStream = new ReadableStream({
      start(controller) {
        controller.enqueue(mediaFileContent);
        controller.close();
      },
    });

    // Upload the main media file to Vercel Blob
    const mediaBlob = await put(mediaFileName!, mediaStream, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log('Media file uploaded to:', mediaBlob.url);

    const mediaItem: MediaItem = {
      id: mediaBlob.pathname,
      src: mediaBlob.url,
      type: mediaFileType?.includes('video') ? 'video' : 'image',
      name: mediaFileName!,
      mtime: new Date().toISOString(),
    };

    // Handle linked media (PDF or URL)
    if (linkedMediaFileContent) {
      if (linkedMediaFileContent.length === 0) {
        console.error('Linked media file content is empty');
        return res.status(400).json({ error: 'Linked media file content is empty' });
      }
      console.log('Linked media file:', { name: linkedMediaFileName, size: linkedMediaFileContent.length });
      const linkedMediaStream = new ReadableStream({
        start(controller) {
          controller.enqueue(linkedMediaFileContent);
          controller.close();
        },
      });
      const pdfBlob = await put(linkedMediaFileName!, linkedMediaStream, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log('Linked media file uploaded to:', pdfBlob.url);
      mediaItem.linkedMedia = { type: 'pdf', url: pdfBlob.url };
    } else if (linkedMediaUrl) {
      console.log('Using linked media URL:', linkedMediaUrl);
      mediaItem.linkedMedia = { type: 'link', url: linkedMediaUrl };
    }

    console.log('Fetching media.json from:', process.env.MEDIA_JSON_BLOB_URL);
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

    console.log('Writing updated media.json to Vercel Blob');
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
  linkedMedia?: {
    type: 'pdf' | 'link';
    url: string;
  };
}

interface MediaJson {
  mediaItems: MediaItem[];
  order: string[];
}
