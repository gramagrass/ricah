import React from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';

const PdfViewer: React.FC = () => {
  const router = useRouter();
  const { url } = router.query;

  if (!url || typeof url !== 'string') {
    return <p className="text-white text-center">No PDF URL provided.</p>;
  }

  return (
    <div className="py-5 px-0 sm:px-4">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
        <div className="w-full h-[80vh]">
          <iframe
            src={url}
            className="w-full h-full border-none"
            title="PDF Viewer"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;