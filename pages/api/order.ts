// pages/api/order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

try {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
  } else {
    console.warn('Redis environment variables (REDIS_URL or REDIS_TOKEN) are not set. Order persistence will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  redis = null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!redis) {
    return res.status(503).json({ message: 'Redis is not available. Order persistence is disabled.' });
  }

  if (req.method === 'POST') {
    try {
      const { order }: { order: string[] } = req.body;
      await redis.set('media_order', JSON.stringify(order));
      res.status(200).json({ message: 'Order saved successfully' });
    } catch (error) {
      console.error('Error saving order:', error);
      res.status(500).json({ message: 'Failed to save order' });
    }
  } else if (req.method === 'GET') {
    try {
      const order = await redis.get('media_order');
      res.status(200).json({ order: order ? JSON.parse(order as string) : [] });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
