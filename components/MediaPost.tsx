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
      className="bg-black"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {type === 'image' ? (
        <img src={src} alt={alt || 'Media'} className="w-full h-auto object-contain max-h-[1920px]" />
      ) : (
        <video src={src} controls muted className="w-full h-auto object-contain max-h-[1920px]" />
      )}
    </motion.div>
  );
};

export default MediaPost;