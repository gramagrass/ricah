// components/Header.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { InfoIcon, ToolIcon, ArrowLeftIcon } from './Icons';

interface HeaderProps {
  onRandomClick?: () => void;
  isRandomActive?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRandomClick, isRandomActive }) => {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  const handleBackClick = () => {
    router.push('/');
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <Link href="/">
        <img
          src="https://0fuqq7uksetsgrwn.public.blob.vercel-storage.com/ricahlogo.png"
          alt="Ricah Logo"
          className="h-8 w-auto cursor-pointer"
        />
      </Link>
      <div className="space-x-2 flex items-center">
        {router.pathname === '/' && onRandomClick ? (
          <button
            onClick={onRandomClick}
            className={`px-3 py-1 rounded h-9 flex items-center ${
              isRandomActive ? 'bg-white text-black' : 'bg-black text-white border border-white'
            }`}
          >
            Random
          </button>
        ) : (
          <button
            onClick={handleBackClick}
            className="p-2 rounded bg-black text-white border border-white h-9 flex items-center"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}
        <Link href="/about">
          <button
            className={`p-2 rounded h-9 flex items-center ${
              isActive('/about') ? 'bg-white text-black' : 'bg-black text-white border border-white'
            }`}
          >
            <InfoIcon className={`w-5 h-5 ${isActive('/about') ? 'text-black' : 'text-white'}`} />
          </button>
        </Link>
        <Link href="/admin">
          <button
            className={`p-2 rounded h-9 flex items-center ${
              isActive('/admin') ? 'bg-white text-black' : 'bg-black text-white border border-white'
            }`}
          >
            <ToolIcon className={`w-5 h-5 ${isActive('/admin') ? 'text-black' : 'text-white'}`} />
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Header;
