import React from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex group z-10">
      {children || <Info className="h-4 w-4 text-slate-400 cursor-help" />}
      <div
        role="tooltip"
        className={`absolute ${positionClasses[position]} w-max max-w-xs p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg 
                   opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      >
        {content}
      </div>
    </div>
  );
};
