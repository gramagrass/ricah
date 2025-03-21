// pages/about.tsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

const About: React.FC = () => {
  const [randomImage, setRandomImage] = useState<string>('');

  useEffect(() => {
    // Generate a random number between 1 and 4
    const randomNum = Math.floor(Math.random() * 4) + 1;
    setRandomImage(`https://0fuqq7uksetsgrwn.public.blob.vercel-storage.com/assets/ricah${randomNum}.jpg`);
  }, []); // Empty dependency array ensures this runs only on initial render

  return (
    <div className="max-w-[1080px] mx-auto py-5 px-4 sm:px-6 lg:px-8">
      <Header />
      <div className="pt-6">
        <p className="text-white text-2xl mb-4">
          RICAH es un proyecto de publicaciones independientes y colectivas compuestas con y desde RICAH, una fotocopiadora china e itinerante. Hoy desde Talleres TELECOM en el barrio Santa Fe de Bogotá. Para participar en los talleres y actividades relacionadas escriba a d@grama.co.
        </p>
        {randomImage && (
          <img
            src={randomImage}
            alt="Random Ricah Image"
            className="w-full max-w-[1080px] mx-auto h-auto object-contain sm:w-screen sm:max-w-none"
          />
        )}
      </div>
    </div>
  );
};

export default About;
