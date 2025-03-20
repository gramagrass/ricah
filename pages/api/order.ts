// pages/api/order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Save the order
    try {
      const { order }: { order: string[] } = req.body;
      await redis.set('media_order', JSON.stringify(order));
      res.status(200).json({ message: 'Order saved successfully' });
    } catch (error) {
      console.error('Error saving order:', error);
      res.status(500).json({ message: 'Failed to save order' });
    }
  } else if (req.method === 'GET') {
    // Fetch the order
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
