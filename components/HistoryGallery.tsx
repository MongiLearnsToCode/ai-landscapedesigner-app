import React, { useState, useLayoutEffect, useRef } from 'react';
import type { HydratedHistoryItem } from '../types';
import { HistoryGalleryItem } from './HistoryGalleryItem';
import { GalleryHorizontal } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface HistoryGalleryProps {
  items: HydratedHistoryItem[];
  onItemClick: (item: HydratedHistoryItem) => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({ items, onItemClick }) => {
  const { navigateTo } = useApp();
  const gridRef = useRef<HTMLDivElement>(null);
  const [visibleItemCount, setVisibleItemCount] = useState(6);

  useLayoutEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const calculateVisibleItems = () => {
      // Check for desktop breakpoint (xl: 1280px)
      if (window.matchMedia('(min-width: 1280px)').matches) {
        const containerHeight = gridEl.clientHeight;
        const containerWidth = gridEl.clientWidth;
        
        // If container dimensions are not ready, do nothing.
        // The ResizeObserver will trigger this function again when they are.
        if (containerHeight === 0 || containerWidth === 0) {
            return;
        }

        const style = window.getComputedStyle(gridEl);
        // On xl, grid-cols-3 applies from md breakpoint
        const columns = style.gridTemplateColumns.split(' ').length || 3;
        const gap = parseFloat(style.gap) || 16; // 1rem from gap-4

        // Item width is determined by the container width and number of columns.
        const itemWidth = (containerWidth - (gap * (columns - 1))) / columns;
        // Item height is determined by its aspect ratio (16:9).
        const itemHeight = itemWidth / (16 / 9);
        const itemHeightWithGap = itemHeight + gap;
        
        if (itemHeightWithGap <= 0) {
            // Avoid division by zero or infinite loops if something is wrong
            return;
        }
        
        // Calculate how many rows can fit in the available height.
        // Add gap to height because the last row doesn't have a gap after it.
        const rowCount = Math.floor((containerHeight + gap) / itemHeightWithGap);
        
        const maxItems = Math.max(0, rowCount * columns);
        setVisibleItemCount(maxItems);
      } else {
        // Fallback for smaller screens, show up to 6 items.
        setVisibleItemCount(6);
      }
    };

    calculateVisibleItems();

    const resizeObserver = new ResizeObserver(calculateVisibleItems);
    resizeObserver.observe(gridEl);

    return () => resizeObserver.disconnect();
  }, [items]);

  const itemsToShow = items.slice(0, visibleItemCount);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 xl:h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 flex-shrink-0">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <GalleryHorizontal className="h-5 w-5 mr-2 text-slate-500" />
            Your Recent Designs
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Click a design to load it, or view all your projects.
          </p>
        </div>
        <button 
          onClick={() => navigateTo('history')}
          className="mt-3 sm:mt-0 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
        >
          View All Projects
        </button>
      </div>
      
      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-grow min-h-0 overflow-y-hidden">
        {itemsToShow.map(item => (
          <HistoryGalleryItem key={item.id} item={item} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
};