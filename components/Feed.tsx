import React, { useState, useEffect } from 'react';
import MediaPost from './MediaPost';
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
        console.log('Feed - Fetch /api/media response status:', res.status);
        const data = await res.json();
        console.log('Feed - Media data fetched:', data);

        if (!data || data.length === 0) {
          setMediaItems([]);
          setRandomizedItems([]);
          return;
        }

        // Sort by mtime (newest first) for the default "date" view
        const sortedData = data.sort((a: MediaItem, b: MediaItem) =>
          new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
        );
        setMediaItems(sortedData);
        setRandomizedItems(sortedData); // Initialize randomizedItems with the sorted data
        console.log('Feed - Sorted media items by mtime:', sortedData);
      } catch (error) {
        console.error('Feed - Error fetching media:', error);
        setMediaItems([]);
        setRandomizedItems([]);
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
    if (sortOption === 'random') {
      // If already in random mode, toggle back to date mode
      setSortOption('date');
      setRandomizedItems(mediaItems); // Reset to the original sorted order
    } else {
      // Switch to random mode and shuffle the items
      setSortOption('random');
      setRandomizedItems(shuffleArray(mediaItems));
    }
  };

  const sortedMediaItems =
    sortOption === 'date'
      ? [...mediaItems]
      : sortOption === 'random'
      ? randomizedItems
      : mediaItems;

  return (
    <div className="py-5 px-0 sm:px-4">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        <Header onRandomClick={handleRandomClick} isRandomActive={sortOption === 'random'} />
      </div>
      <div className="w-full px-0">
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
