import type { NextPage } from 'next';
import Link from 'next/link';

const About: NextPage = () => {
  return (
    <div className="max-w-[1080px] mx-auto py-5 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">About Ricah</h1>
        <Link href="/">
          <button className="px-3 py-1 rounded bg-black text-white border border-white">
            Back to Feed
          </button>
        </Link>
      </div>
      <div className="text-white">
        <p>Your about page content goes here.</p>
        <p>Describe what Ricah is, its purpose, or any other information you'd like to share.</p>
      </div>
    </div>
  );
};

export default About;