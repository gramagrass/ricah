// components/Feed.tsx
import React, { useState, useEffect } from 'react';
import MediaPost from './MediaPost';
import Link from 'next/link';

type MediaItem = {
  id: string;
  src: string;
  type: 'image' | 'video';
  name: string;
  mtime: string;
};

type SortOption = 'date' | 'random' | 'custom';

const Feed: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('custom');
  const [randomizedItems, setRandomizedItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media');
        const data = await res.json();
        console.log('Feed - Media data fetched:', data);

        const orderRes = await fetch('/api/order');
        const { order } = await orderRes.json();
        console.log('Feed - Fetched order:', order);

        if (order && order.length > 0) {
          const orderedItems = [...data].sort((a: MediaItem, b: MediaItem) => {
            const aIndex = order.indexOf(a.id);
            const bIndex = order.indexOf(b.id);
            return aIndex - bIndex;
          });
          setMediaItems(orderedItems);
        } else {
          setMediaItems(data);
        }
        setRandomizedItems(data);
      } catch (error) {
        console.error('Error fetching media:', error);
      }
    };
    fetchMedia();
  }, []);

  const shuffleArray = (array: MediaItem[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleRandomClick = () => {
    setSortOption('random');
    setRandomizedItems(shuffleArray(mediaItems));
  };

  const sortedMediaItems =
    sortOption === 'date'
      ? [...mediaItems].sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime())
      : sortOption === 'random'
      ? randomizedItems
      : mediaItems;

  return (
    <div className="max-w-[1080px] mx-auto py-5 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Ricah</h1>
        <div className="space-x-2">
          <button
            onClick={() => setSortOption('custom')}
            className={`px-3 py-1 rounded ${
              sortOption === 'custom' ? 'bg-white text-black' : 'bg-black text-white border border-white'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => setSortOption('date')}
            className={`px-3 py-1 rounded ${
              sortOption === 'date' ? 'bg-white text-black' : 'bg-black text-white border border-white'
            }`}
          >
            Reciente
          </button>
          <button
            onClick={handleRandomClick}
            className={`px-3 py-1 rounded ${
              sortOption === 'random' ? 'bg-white text-black' : 'bg-black text-white border border-white'
            }`}
          >
            Random
          </button>
          <Link href="/about">
            <button className="px-3 py-1 rounded bg-black text-white border border-white">
              Info
            </button>
          </Link>
          <Link href="/admin">
            <button className="px-3 py-1 rounded bg-black text-white border border-white">
              Admin
            </button>
          </Link>
        </div>
      </div>
      <div>
        {sortedMediaItems.length === 0 ? (
          <p className="text-white">No media items available.</p>
        ) : (
          sortedMediaItems.map((item) => (
            <div key={item.id}>
              <MediaPost src={item.src} type={item.type} alt={item.name} />
              <p className="text-white text-sm">{item.src}</p> {/* Debug: Show the src URL */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
