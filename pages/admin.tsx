import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

type MediaItem = {
  id: string;
  src: string;
  type: 'image' | 'video';
  name: string;
  mtime: string;
};

const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const fetchMedia = async () => {
    try {
      console.log('Admin - Fetching media from /api/media...');
      const res = await fetch('/api/media');
      console.log('Admin - Fetch response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Admin - Media data fetched:', data);
        if (!data || data.length === 0) {
          console.log('Admin - No media items returned from /api/media');
          setMediaItems([]);
          return;
        }
        // Sort by mtime (newest first)
        const sortedData = data.sort((a: MediaItem, b: MediaItem) =>
          new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
        );
        setMediaItems(sortedData);
        console.log('Admin - Sorted media items by mtime:', sortedData);
      } else {
        const errorText = await res.text();
        console.error('Admin - Failed to fetch media:', errorText);
        setMediaItems([]);
      }
    } catch (error) {
      console.error('Admin - Error fetching media:', error);
      setMediaItems([]);
    }
  };

  useEffect(() => {
    console.log('Admin - isLoggedIn:', isLoggedIn);
    if (isLoggedIn) {
      fetchMedia();
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) {
      alert('Please select a media file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('media', mediaFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchMedia();
        setMediaFile(null);
        alert('Media uploaded successfully');
      } else {
        const errorText = await res.text();
        console.error('Admin - Upload response:', errorText);
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Admin - Upload error:', error);
      alert('Upload error');
    }
  };

  const handleDelete = async (url: string) => {
    try {
      const res = await fetch(`/api/delete?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchMedia();
        alert('Media deleted successfully');
      } else {
        const errorText = await res.text();
        console.error('Admin - Delete response:', errorText);
        alert('Delete failed');
      }
    } catch (error) {
      console.error('Admin - Delete error:', error);
      alert('Delete error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-[1080px] mx-auto py-5 px-4 sm:px-6 lg:px-8">
        <Header />
        <h1 className="text-2xl font-bold text-white mb-4">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full px-3 py-2 bg-black text-white border border-white rounded"
          />
          <button type="submit" className="px-4 py-2 bg-white text-black rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  console.log('Admin - Rendering admin grid with mediaItems:', mediaItems);

  return (
    <div className="py-5 px-0 sm:px-4">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
        <form onSubmit={handleAddMedia} className="mb-4 space-y-4">
          <div>
            <label className="block w-full mb-2">
              <span className="block w-full px-4 py-2 bg-white text-black text-center rounded cursor-pointer">
                Select Media File (Image/Video)
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                name="media"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  console.log('Selected media file:', file);
                  setMediaFile(file);
                }}
                className="hidden"
              />
            </label>
            {mediaFile && <p className="text-white">Selected: {mediaFile.name}</p>}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white text-black rounded"
            disabled={!mediaFile}
          >
            Upload Media
          </button>
        </form>
      </div>
      <div className="grid grid-cols-3 gap-4 w-full max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        {mediaItems.length === 0 ? (
          <p className="text-white text-center col-span-3">No media items available.</p>
        ) : (
          mediaItems.map((item) => (
            <div key={item.id} className="bg-black relative">
              {item.type === 'image' ? (
                <img
                  src={item.src}
                  alt={item.name}
                  className="w-full h-auto object-contain"
                  onError={(e) => console.error(`Failed to load image: ${item.src}`, e)}
                />
              ) : (
                <video src={item.src} controls muted className="w-full h-auto object-contain" />
              )}
              <button
                onClick={() => handleDelete(item.src)}
                className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Admin;
