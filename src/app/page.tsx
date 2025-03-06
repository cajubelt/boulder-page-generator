'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageUploader from '../../components/ImageUploader';
import ImageCanvas from '../../components/ImageCanvas';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  return (
    <div className="min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={30}
            priority
          />
          <h1 className="text-2xl font-bold">Image Arrow Annotator</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload an Image</h2>
          <ImageUploader onImageUpload={handleImageUpload} />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Image Preview</h2>
          {uploadedImage && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-1">Drawing Instructions:</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Click and drag on the image to draw arrows</li>
                <li>Arrows are drawn from the starting point to where you release the mouse</li>
                <li>Click on an existing arrow to select it and adjust its curvature</li>
                <li>Use the curvature slider to create curved arrows</li>
                <li>The coordinates of each arrow will be displayed below the image</li>
                <li>Use the "Clear All" button to remove all arrows</li>
              </ul>
            </div>
          )}
          <ImageCanvas imageUrl={uploadedImage} />
        </div>
      </main>

      <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Image Arrow Annotator - Built with Next.js</p>
      </footer>
    </div>
  );
}
