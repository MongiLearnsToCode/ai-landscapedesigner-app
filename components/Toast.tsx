import React, { useEffect, useState } from 'react';
import type { ToastMessage } from '../types';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

const ICONS: Record<ToastMessage['type'], React.ReactNode> = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    info: <Info className="h-6 w-6 text-sky-500" />,
};

const TYPE_CLASSES = {
    success: 'border-green-200/80',
    error: 'border-red-200/80',
    info: 'border-sky-200/80',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        handleDismiss();
    }, 4000); // Shortened duration from 5s to 4s

    return () => clearTimeout(timer);
  }, [toast.id]);
  
  return (
    <div
      role="alert"
      onClick={handleDismiss} // Make the entire toast clickable to dismiss
      className={`
        w-full max-w-sm rounded-xl shadow-lg p-4 bg-white/80 backdrop-blur-sm border flex items-center ring-1 ring-black/5 cursor-pointer
        ${TYPE_CLASSES[toast.type]}
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
      `}
    >
      <div className="flex-shrink-0">{ICONS[toast.type]}</div>
      <div className="ml-3 text-sm font-medium text-slate-800">{toast.message}</div>
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent parent onClick from firing too
          handleDismiss();
        }} 
        className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex h-8 w-8 text-slate-400 hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-slate-300" 
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};