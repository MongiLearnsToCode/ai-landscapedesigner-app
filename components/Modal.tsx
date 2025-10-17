import React, { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { X } from 'lucide-react';

interface ModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ imageUrl, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Accessibility: Trap focus within the modal
  useFocusTrap(modalRef);

  // Accessibility: Close on Escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  // Reset loading state when image url changes
  useEffect(() => {
    setIsLoading(true);
  }, [imageUrl]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 lg:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged image view"
    >
      <div
        ref={modalRef}
        className={`relative ${isLoading ? 'w-20 h-20' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
            <div className="absolute inset-0 flex justify-center items-center">
                <div className="w-full h-full border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            </div>
        )}
        <img
          src={imageUrl}
          alt="Enlarged view"
          className={`block max-w-full max-h-full object-contain rounded-lg lg:rounded-xl lg:shadow-2xl transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
        />
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 bg-black/40 text-white rounded-full h-8 w-8 flex items-center justify-center hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white z-10 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          aria-label="Close"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
