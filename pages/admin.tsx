import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Header from '../components/Header';

type MediaItem = {
  id: string;
  src: string;
  type: 'image' | 'video';
  name: string;
  mtime: string;
  linkedMedia?: {
    type: 'pdf' | 'link';
    url: string;
  };
};

const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [linkedMediaType, setLinkedMediaType] = useState<'pdf' | 'link' | 'none'>('none');
  const [linkedMediaUrl, setLinkedMediaUrl] = useState<string>('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [linkedMediaFile, setLinkedMediaFile] = useState<File | null>(null);

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

        let order: string[] = [];
        try {
          const orderRes = await fetch('/api/order');
          console.log('Admin - Fetch /api/order response status:', orderRes.status);
          if (orderRes.ok) {
            const orderData = await orderRes.json();
            order = orderData.order || [];
            console.log('Admin - Fetched order:', order);
          } else {
            console.warn('Admin - Failed to fetch order, falling back to mtime sort.');
          }
        } catch (error) {
          console.error('Admin - Error fetching order:', error);
          console.warn('Admin - Falling back to mtime sort.');
        }

        if (order && order.length > 0) {
          const orderedItems = [...data].sort((a: MediaItem, b: MediaItem) => {
            const aIndex = order.indexOf(a.id);
            const bIndex = order.indexOf(b.id);
            return aIndex - bIndex;
          });
          setMediaItems(orderedItems);
          console.log('Admin - Ordered media items:', orderedItems);
        } else {
          const sortedData = data.sort((a: MediaItem, b: MediaItem) =>
            new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
          );
          setMediaItems(sortedData);
          console.log('Admin - Sorted media items by mtime:', sortedData);
        }
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

    if (linkedMediaType === 'pdf' && linkedMediaFile) {
      formData.append('linkedMedia', linkedMediaFile);
    } else if (linkedMediaType === 'link' && linkedMediaUrl) {
      formData.append('linkedMediaUrl', linkedMediaUrl);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchMedia();
        try {
          const orderRes = await fetch('/api/order');
          if (orderRes.ok) {
            const { order } = await orderRes.json();
            const newOrder = [...(order || []), mediaItems[mediaItems.length - 1]?.id].filter(Boolean);
            await fetch('/api/order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order: newOrder }),
            });
          }
        } catch (error) {
          console.error('Admin - Error updating order after upload:', error);
        }
        setMediaFile(null);
        setLinkedMediaType('none');
        setLinkedMediaUrl('');
        setLinkedMediaFile(null);
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
        const deletedItem = mediaItems.find((item) => item.src.includes(url));
        if (deletedItem) {
          try {
            const orderRes = await fetch('/api/order');
            if (orderRes.ok) {
              const { order } = await orderRes.json();
              const newOrder = (order || []).filter((id: string) => id !== deletedItem.id);
              await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: newOrder }),
              });
            }
          } catch (error) {
            console.error('Admin - Error updating order after delete:', error);
          }
        }
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

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(mediaItems);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setMediaItems(reorderedItems);

    const order = reorderedItems.map((item) => item.id);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Admin - Failed to save order:', errorText);
        alert('Failed to save order');
      }
    } catch (error) {
      console.error('Admin - Error saving order:', error);
      alert('Error saving order');
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
          <div className="space-y-2">
            <label className="text-white">Link to:</label>
            <select
              value={linkedMediaType}
              onChange={(e) => setLinkedMediaType(e.target.value as 'pdf' | 'link' | 'none')}
              className="w-full px-3 py-2 bg-black text-white border border-white rounded"
            >
              <option value="none">None</option>
              <option value="pdf">PDF</option>
              <option value="link">Link URL</option>
            </select>
            {linkedMediaType === 'pdf' && (
              <>
                <input
                  type="file"
                  accept="application/pdf"
                  name="linkedMedia"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    console.log('Selected linked media file:', file);
                    setLinkedMediaFile(file);
                  }}
                  className="w-full px-3 py-2 bg-black text-white border border-white rounded"
                />
                {linkedMediaFile && <p className="text-white">Selected: {linkedMediaFile.name}</p>}
              </>
            )}
            {linkedMediaType === 'link' && (
              <input
                type="text"
                value={linkedMediaUrl}
                onChange={(e) => setLinkedMediaUrl(e.target.value)}
                placeholder="Enter URL (e.g., https://example.com)"
                className="w-full px-3 py-2 bg-black text-white border border-white rounded"
              />
            )}
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
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="media-grid" direction="horizontal">
          {(provided) => (
            <div
              className="grid grid-cols-3 gap-4 w-full max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {mediaItems.length === 0 ? (
                <p className="text-white text-center col-span-3">No media items available.</p>
              ) : (
                mediaItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-black relative"
                      >
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
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Admin;
