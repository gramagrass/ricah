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

const Feed: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [displayItems, setDisplayItems] = useState<MediaItem[]>([]);
  const [isRandomized, setIsRandomized] = useState(false);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media');
        console.log('Feed - Fetch /api/media response status:', res.status);
        const data = await res.json();
        console.log('Feed - Media data fetched:', data);

        if (!data || data.length === 0) {
          setMediaItems([]);
          setDisplayItems([]);
          return;
        }

        // Remove duplicates by id (in case the API returns duplicates)
        const uniqueData = Array.from(
          new Map(data.map((item: MediaItem) => [item.id, item])).values()
        );
        console.log('Feed - Unique media items:', uniqueData);

        // Sort by mtime (newest first) for the initial view
        const sortedData = uniqueData.sort((a: MediaItem, b: MediaItem) =>
          new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
        );
        setMediaItems(sortedData);
        setDisplayItems(sortedData);
        console.log('Feed - Sorted media items by mtime:', sortedData);
      } catch (error) {
        console.error('Feed - Error fetching media:', error);
        setMediaItems([]);
        setDisplayItems([]);
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
    const shuffledItems = shuffleArray(mediaItems);
    console.log('Feed - Shuffled items:', shuffledItems);
    setDisplayItems(shuffledItems);
    setIsRandomized(true);
  };

  return (
    <div className="py-5 px-0 sm:px-4">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        <Header onRandomClick={handleRandomClick} isRandomActive={isRandomized} />
      </div>
      <div className="w-full px-0">
        {displayItems.length === 0 ? (
          <p className="text-white text-center">No media items available.</p>
        ) : (
          displayItems.map((item) => (
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
