// components/Feed.tsx
import React, { useState, useEffect } from 'react';
import MediaPost from './MediaPost';
import Link from 'next/link';
import Header from './Header';

type MediaItem = {
  id: string;
  src: string;
  type: 'image' | 'video';
  name: string;
  mtime: string;
};

type SortOption = 'date' | 'random';

const Feed: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [randomizedItems, setRandomizedItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media');
        const data = await res.json();
        console.log('Feed - Media data fetched:', data);

        let order: string[] = [];
        try {
          const orderRes = await fetch('/api/order');
          if (orderRes.ok) {
            const orderData = await orderRes.json();
            order = orderData.order || [];
            console.log('Feed - Fetched order:', order);
          } else {
            console.warn('Failed to fetch order, falling back to mtime sort.');
          }
        } catch (error) {
          console.error('Error fetching order:', error);
          console.warn('Falling back to mtime sort.');
        }

        if (order && order.length > 0) {
          const orderedItems = [...data].sort((a: MediaItem, b: MediaItem) => {
            const aIndex = order.indexOf(a.id);
            const bIndex = order.indexOf(b.id);
            return aIndex - bIndex;
          });
          setMediaItems(orderedItems);
        } else {
          const sortedData = data.sort((a: MediaItem, b: MediaItem) =>
            new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
          );
          setMediaItems(sortedData);
        }
        setRandomizedItems(data);
      } catch (error) {
        console.error('Error fetching media:', error);
        setMediaItems([]);
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
      ? [...mediaItems]
      : sortOption === 'random'
      ? randomizedItems
      : mediaItems;

  return (
    <div className="w-full">
      <div className="max-w-[1080px] mx-auto py-5 px-4 sm:px-6 lg:px-8">
        <Header onRandomClick={handleRandomClick} isRandomActive={sortOption === 'random'} />
      </div>
      <div className="w-full">
        {sortedMediaItems.length === 0 ? (
          <p className="text-white text-center">No media items available.</p>
        ) : (
          sortedMediaItems.map((item) => (
            <div key={item.id}>
              <MediaPost src={item.src} type={item.type} alt={item.name} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
