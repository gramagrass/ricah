// pages/api/order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  password: process.env.REDIS_TOKEN,
});

console.log('Redis client initialized successfully');
// Test the connection
await redis.set('test_key', 'test_value');
const testValue = await redis.get('test_key');
console.log('Redis test operation successful, value:', testValue);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { order }: { order: string[] } = req.body;
      console.log('Saving order:', order);
      await redis.set('media_order', JSON.stringify(order));
      console.log('Order saved successfully');
      res.status(200).json({ message: 'Order saved successfully' });
    } catch (error) {
      console.error('Error saving order:', error);
      res.status(500).json({ message: 'Failed to save order' });
    }
  } else if (req.method === 'GET') {
    try {
      const order = await redis.get('media_order');
      console.log('Fetched order:', order);
      res.status(200).json({ order: order ? JSON.parse(order) : [] });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
