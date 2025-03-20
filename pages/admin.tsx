import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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

  // Fetch media on mount and after upload
  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data);
      } else {
        console.error('Failed to fetch media:', await res.text());
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchMedia(); // Fetch media when logged in
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

  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchMedia(); // Re-fetch media after upload
        alert('Media uploaded successfully');
      } else {
        const errorText = await res.text();
        console.error('Upload response:', errorText);
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-[1080px] mx-auto py-5 px-4 sm:px-6 lg:px-8">
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
        <Link href="/">
          <button className="mt-4 px-4 py-2 bg-black text-white border border-white rounded">
            Back to Feed
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] mx-auto py-5 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <Link href="/">
          <button className="px-4 py-2 bg-black text-white border border-white rounded">
            Back to Feed
          </button>
        </Link>
      </div>
      <label className="block w-full mb-4">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleAddMedia}
          className="hidden"
        />
        <span className="block w-full px-4 py-2 bg-white text-black text-center rounded cursor-pointer">
          Add New Media
        </span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {mediaItems.map((item) => (
          <div key={item.id} className="bg-black">
            {item.type === 'image' ? (
              <img src={item.src} alt={item.name} className="w-full h-auto object-cover" />
            ) : (
              <video src={item.src} controls muted className="w-full h-auto object-cover" />
            )}
            <p className="text-white text-sm mt-1">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
