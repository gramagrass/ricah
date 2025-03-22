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
    const { files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    });

    const mediaFile = Array.isArray(files.media) ? files.media[0] : files.media;

    if (!mediaFile) {
      console.error('No media file uploaded');
      return res.status(400).json({ error: 'No media file uploaded' });
    }

    // Read the file content from the temporary filepath
    const mediaFileContent = await fs.readFile(mediaFile.filepath);
    if (!mediaFileContent || mediaFileContent.length === 0) {
      console.error('Media file content is empty after reading');
      return res.status(400).json({ error: 'Media file content is empty' });
    }

    // Upload the media file to Vercel Blob
    const mediaBlob = await put(mediaFile.originalFilename || 'unnamed', mediaFileContent, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({
      message: 'Media uploaded successfully',
      mediaItem: {
        id: mediaBlob.pathname,
        src: mediaBlob.url,
        type: mediaFile.mimetype?.includes('video') ? 'video' : 'image',
        name: mediaFile.originalFilename || 'unnamed',
        mtime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return res.status(500).json({ error: 'Error uploading media' });
  }
}
