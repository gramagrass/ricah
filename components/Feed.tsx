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
        setMediaItems(data);
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

  const sortedMediaItems = sortOption === 'date'
    ? [...mediaItems].sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime())
    : randomizedItems;

  return (
    <div className="max-w-[1080px] mx-auto py-5 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Ricah</h1>
        <div className="space-x-2">
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
        {sortedMediaItems.map((item) => (
          <MediaPost key={item.id} src={item.src} type={item.type} alt={item.name} />
        ))}
      </div>
    </div>
  );
};

export default Feed;