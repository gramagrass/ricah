// components/MediaPost.tsx
import React from 'react';
import { motion } from 'framer-motion';

type MediaPostProps = {
  src: string;
  type: 'image' | 'video';
  alt?: string;
};

const MediaPost: React.FC<MediaPostProps> = ({ src, type, alt }) => {
  return (
    <motion.div
      className="bg-black w-screen max-w-none sm:w-full sm:max-w-[1080px] sm:mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {type === 'image' ? (
        <img
          src={src}
          alt={alt || 'Media'}
          className="w-full h-auto object-contain"
          onError={(e) => console.error(`Failed to load image: ${src}`, e)}
        />
      ) : (
        <video src={src} controls muted className="w-full h-auto object-contain" />
      )}
    </motion.div>
  );
};

export default MediaPost;
