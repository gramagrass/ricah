// pages/about.tsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

const gettRandomImage = () => {
  const randomNum = Math.floor(Math.random() * 4) + 1;
  return `https://0fuqq7uksetsgrwn.public.blob.vercel-storage.com/assets/ricah${randomNum}.jpg`;
};

const About: React.FC = () => {
  const [randomImage, setRandomImage] = useState<string>('');

  useEffect(() => {
    setRandomImage(gettRandomImage());
  }, []); // Empty dependency array ensures this runs only on initial render

  return (
    <div className="py-5 px-0 sm:px-4">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
        <div className="pt-6">
          <p className="text-white text-2xl mb-4">
            RICAH es un proyecto de publicaciones independientes y colectivas compuestas con y desde RICAH, una fotocopiadora china e itinerante. Hoy desde Talleres TELECOM en el barrio Santa Fe de Bogotá. Para participar en los talleres y actividades relacionadas escriba a d@grama.co.
          </p>
        </div>
      </div>
      {randomImage && (
        <div className="w-full px-0">
          <img
            src={randomImage}
            alt="Random Ricah Image"
            className="w-full max-w-[1080px] mx-auto h-auto object-contain sm:w-full sm:max-w-none"
          />
        </div>
      )}
    </div>
  );
};

export default About;
