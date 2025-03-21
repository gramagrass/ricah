// components/Header.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { InfoIcon, ToolIcon } from './Icons';

const Header: React.FC = () => {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  const handleRandomClick = () => {
    // We'll handle this in Feed.tsx; for now, just navigate to the Feed page
    router.push('/');
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <Link href="/">
        <h1 className="text-2xl font-bold text-white cursor-pointer">Ricah</h1>
      </Link>
      <div className="space-x-2">
        {router.pathname === '/' && (
          <button
            onClick={handleRandomClick}
            className="px-3 py-1 rounded bg-black text-white border border-white"
          >
            Random
          </button>
        )}
        <Link href="/about">
          <button
            className={`p-2 rounded ${
              isActive('/about') ? 'bg-white text-black' : 'bg-black text-white border border-white'
            }`}
          >
            <InfoIcon className="w-5 h-5" />
          </button>
        </Link>
        <Link href="/admin">
          <button
            className={`p-2 rounded ${
              isActive('/admin') ? 'bg-white text-black' : 'bg-black text-white border border-white'
            }`}
          >
            <ToolIcon className="w-5 h-5" />
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Header;
