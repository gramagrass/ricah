// In pages/admin.tsx
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
      // Fetch the current order and append the new item
      const orderRes = await fetch('/api/order');
      const { order } = await orderRes.json();
      const newOrder = [...(order || []), mediaItems[mediaItems.length - 1]?.id];
      await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });
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
      await fetchMedia();
      // Update the order in Redis by removing the deleted item
      const deletedItem = mediaItems.find((item) => item.src === url);
      if (deletedItem) {
        const orderRes = await fetch('/api/order');
        const { order } = await orderRes.json();
        const newOrder = (order || []).filter((id: string) => id !== deletedItem.id);
        await fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: newOrder }),
        });
      }
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
