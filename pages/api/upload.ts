import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { put } from '@vercel/blob';

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
      console.error('No media file uploaded');
      return res.status(400).json({ error: 'No media file uploaded' });
    }

    try {
      // Validate media file content
      const mediaFileContent = mediaFile._buf;
      if (!mediaFileContent || mediaFileContent.length === 0) {
        console.error('Media file content is empty');
        return res.status(400).json({ error: 'Media file content is empty' });
      }
      console.log('Uploading media file:', mediaFile.originalFilename, 'Size:', mediaFileContent.length);

      // Upload the main media file to Vercel Blob with Content-Length header
      const mediaBlob = await put(mediaFile.originalFilename || 'unnamed', mediaFileContent, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        headers: {
          'Content-Length': mediaFileContent.length.toString(),
        },
      });
      console.log('Media file uploaded to:', mediaBlob.url);

      const mediaItem: MediaItem = {
        id: mediaBlob.pathname,
        src: mediaBlob.url,
        type: mediaFile.mimetype?.includes('video') ? 'video' : 'image',
        name: mediaFile.originalFilename || 'unnamed',
        mtime: new Date().toISOString(),
      };

      // Handle linked media (PDF or URL)
      if (linkedMediaFile) {
        const linkedMediaFileContent = linkedMediaFile._buf;
        if (!linkedMediaFileContent || linkedMediaFileContent.length === 0) {
          console.error('Linked media file content is empty');
          return res.status(400).json({ error: 'Linked media file content is empty' });
        }
        console.log('Uploading linked media file:', linkedMediaFile.originalFilename, 'Size:', linkedMediaFileContent.length);
        const pdfBlob = await put(linkedMediaFile.originalFilename || 'unnamed.pdf', linkedMediaFileContent, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          headers: {
            'Content-Length': linkedMediaFileContent.length.toString(),
          },
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
      await put('media.json', mediaJsonContent, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        headers: {
          'Content-Length': Buffer.from(mediaJsonContent).length.toString(),
        },
      });
      console.log('media.json updated successfully');

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
