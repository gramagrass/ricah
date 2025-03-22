import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { InfoIcon, ToolIcon } from './Icons';

interface HeaderProps {
  onRandomClick?: () => void;
  isRandomActive?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRandomClick, isRandomActive = false }) => {
  return (
    <header className="flex justify-between items-center mb-4">
      <Link href="/">
        <Image
          src="https://0fuqq7uksetsgrwn.public.blob.vercel-storage.com/assets/ricahlogo.png"
          alt="Ricah Logo"
          width={100} // Adjust width based on your logo's dimensions
          height={40} // Adjust height based on your logo's dimensions
          className="object-contain"
        />
      </Link>
      <div className="flex space-x-4 items-center">
        <Link href="/info">
          <InfoIcon className="w-6 h-6 text-white hover:text-gray-300" />
        </Link>
        <Link href="/admin">
          <ToolIcon className="w-6 h-6 text-white hover:text-gray-300" />
        </Link>
        {onRandomClick && (
          <button
            onClick={onRandomClick}
            className={`px-4 py-2 rounded ${
              isRandomActive ? 'bg-white text-black' : 'bg-black text-white border border-white'
            }`}
          >
            Random
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
