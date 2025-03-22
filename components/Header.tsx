import React from 'react';
import Link from 'next/link';

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
      <div className="flex space-x-4">
        <Link href="/admin">
          <span className="text-white hover:underline">Admin</span>
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
