import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { BlobServiceClient } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const mediaFile = files.media as formidable.File;
    const linkedMediaFile = files.linkedMedia as formidable.File;
    const linkedMediaUrl = fields.linkedMediaUrl as string;

    if (!mediaFile) {
      return res.status(400).json({ error: 'No media file uploaded' });
    }

    const blobServiceClient = new BlobServiceClient(process.env.BLOB_SAS_URL!);
    const containerClient = blobServiceClient.getContainerClient('assets');

    // Upload the main media file (image or video)
    const mediaBlobName = `${Date.now()}-${mediaFile.originalFilename}`;
    const mediaBlockBlobClient = containerClient.getBlockBlobClient(mediaBlobName);
    await mediaBlockBlobClient.uploadFile(mediaFile.filepath);

    const mediaItem: MediaItem = {
      id: mediaBlobName,
      src: mediaBlockBlobClient.url,
      type: mediaFile.mimetype?.includes('video') ? 'video' : 'image',
      name: mediaFile.originalFilename || 'unnamed',
      mtime: new Date().toISOString(),
    };

    // Handle linked media (PDF or URL)
    if (linkedMediaFile) {
      // Upload the PDF
      const pdfBlobName = `${Date.now()}-${linkedMediaFile.originalFilename}`;
      const pdfBlockBlobClient = containerClient.getBlockBlobClient(pdfBlobName);
      await pdfBlockBlobClient.uploadFile(linkedMediaFile.filepath);
      mediaItem.linkedMedia = { type: 'pdf', url: pdfBlockBlobClient.url };
    } else if (linkedMediaUrl) {
      // Store the outbound link
      mediaItem.linkedMedia = { type: 'link', url: linkedMediaUrl };
    }

    // Update the order in the database (e.g., using Upstash Redis)
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const order = (await redis.get<string[]>('media-order')) || [];
    order.push(mediaItem.id);
    await redis.set('media-order', order);

    return res.status(200).json({ message: 'Media uploaded successfully' });
  });
}