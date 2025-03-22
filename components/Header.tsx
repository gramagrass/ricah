import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  onRandomClick?: () => void;
  isRandomActive?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRandomClick, isRandomActive = false }) => {
  return (
    <header className="flex justify-between items-center mb-4">
      <Link href="/">
        <h1 className="text-2xl font-bold text-white">Ricah</h1>
      </Link>
      <div className="flex space-x-4 items-center">
        <Link href="/info">
          <Image
            src="/assets/info-icon.png"
            alt="Info"
            width={24}
            height={24}
            className="hover:opacity-80"
          />
        </Link>
        <Link href="/admin">
          <Image
            src="/assets/admin-icon.png"
            alt="Admin"
            width={24}
            height={24}
            className="hover:opacity-80"
          />
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
