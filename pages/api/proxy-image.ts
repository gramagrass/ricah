// pages/api/proxy-image.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (typeof url !== 'string') {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.buffer();

    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ message: 'Failed to proxy image' });
  }
}
