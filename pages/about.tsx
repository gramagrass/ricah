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
    <div className="py-5 px-0">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
        <div className="pt-6">
          <p className="text-white text-2xl mb-4">
            RICAH es un proyecto de publicaciones independientes y colectivas compuestas con y desde RICAH, una fotocopiadora china e itinerante. Hoy desde Talleres TELECOM en el barrio Santa Fe de Bogotá. Para participar en los talleres y actividades relacionadas escriba a d@grama.co.
          </p>
        </div>
      </div>
      {randomImage && (
        <div className="w-full sm:-mx-4">
          <img
            src={randomImage}
            alt="Random Ricah Image"
            className="w-full h-auto object-contain sm:w-screen sm:-mx-4 md:w-full md:max-w-[1080px] md:mx-auto"
          />
        </div>
      )}
    </div>
  );
};

export default About;
