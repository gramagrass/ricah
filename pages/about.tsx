// pages/about.tsx
import React from 'react';
import Header from '../components/Header';

const About: React.FC = () => {
  return (
    <div className="max-w-[1080px] mx-auto py-5 px-4 sm:px-6 lg:px-8">
      <Header />
      <h1 className="text-2xl font-bold text-white mb-4">About Ricah</h1>
      <p className="text-white">This is the about page for Ricah.</p>
    </div>
  );
};

export default About;
