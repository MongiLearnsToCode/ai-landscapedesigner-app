import React, { useState } from 'react';

interface ImageWithLoaderProps {
  src: string;
  alt: string;
}

export const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({ src, alt }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="absolute inset-0 w-full h-full">
      {isLoading && (
        <div className="w-full h-full bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)} // Also stop loading on error
      />
    </div>
  );
};
