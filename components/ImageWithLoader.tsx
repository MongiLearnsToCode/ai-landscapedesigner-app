import React, { useState, useRef, useEffect } from 'react';

interface ImageWithLoaderProps {
  src: string;
  alt: string;
  lazy?: boolean;
}

export const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({ src, alt, lazy = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      {isLoading && (
        <div className="w-full h-full bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)} // Also stop loading on error
        />
      )}
    </div>
  );
};
