import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

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

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        const sortedData = data.sort((a: MediaItem, b: MediaItem) =>
          new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
        );
        setMediaItems(sortedData);
      } else {
        console.error('Failed to fetch media:', await res.text());
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  useEffect(() => {
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
        await fetchMedia();
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

  const handleDelete = async (url: string) => {
    try {
      const res = await fetch(`/api/delete?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchMedia(); // Re-fetch media after deletion
        alert('Media deleted successfully');
      } else {
        const errorText = await res.text();
        console.error('Delete response:', errorText);
        alert('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete error');
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(mediaItems);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setMediaItems(reorderedItems);
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
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="media-grid" direction="horizontal">
          {(provided) => (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {mediaItems.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-black relative"
                    >
                      {item.type === 'image' ? (
                        <img src={item.src} alt={item.name} className="w-full h-auto object-cover" />
                      ) : (
                        <video src={item.src} controls muted className="w-full h-auto object-cover" />
                      )}
                      <p className="text-white text-sm mt-1">{item.name}</p>
                      <button
                        onClick={() => handleDelete(item.src)}
                        className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Admin;
