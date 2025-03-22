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

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media');
        console.log('Feed - Fetch /api/media response status:', res.status);
        const data = await res.json();
        console.log('Feed - Media data fetched:', data);

        if (!data || data.length === 0) {
          setMediaItems([]);
          return;
        }

        // Sort by mtime (newest first)
        const sortedData = data.sort((a: MediaItem, b: MediaItem) =>
          new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
        );
        setMediaItems(sortedData);
        console.log('Feed - Sorted media items by mtime:', sortedData);
      } catch (error) {
        console.error('Feed - Error fetching media:', error);
        setMediaItems([]);
      }
    };
    fetchMedia();
  }, []);

  return (
    <div className="py-5 px-0 sm:px-4">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        <Header onRandomClick={() => {}} isRandomActive={false} />
      </div>
      <div className="w-full px-0">
        {mediaItems.length === 0 ? (
          <p className="text-white text-center">No media items available.</p>
        ) : (
          mediaItems.map((item) => (
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
