import React, { useState, useEffect } from 'react';
import type { HydratedHistoryItem } from '../types';
import { Pin, Trash2, Eye } from 'lucide-react';
import { ImageWithLoader } from './ImageWithLoader';
import { getCloudinaryUrl } from '../services/cloudinaryService';
import { LANDSCAPING_STYLES } from '../constants';

interface HistoryCardProps {
  item: HydratedHistoryItem;
  onView: (item: HydratedHistoryItem) => void;
  onPin: (id: string) => void;
  onAttemptUnpin: (id: string) => void;
  onDelete: (id: string) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  viewMode: 'list' | 'grid';
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ 
  item, onView, onPin, onAttemptUnpin, onDelete, 
  isSelectionMode, isSelected, onToggleSelection, viewMode,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Use the direct image URL from the minimized data structure
    const cloudinaryUrl = item.redesignedImageUrl;

    if (isMounted && cloudinaryUrl) {
      setImageUrl(cloudinaryUrl);
    }

    return () => { isMounted = false; };
  }, [item.redesignedImageUrl]);

  const styleNames = item.styles.map(styleId => LANDSCAPING_STYLES.find(s => s.id === styleId)?.name || styleId).join(' & ');
    
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    item.isPinned ? onAttemptUnpin(item.id) : onPin(item.id);
  };
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  }
  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(item);
  }
  const handleCardClick = () => {
    isSelectionMode ? onToggleSelection(item.id) : onView(item);
  };

  const cardStateClasses = isSelectionMode
    ? `ring-2 ${isSelected ? 'ring-orange-500 bg-orange-50' : 'ring-transparent hover:ring-slate-300'}`
    : "hover:shadow-lg hover:border-slate-300";

  if (viewMode === 'grid') {
    return (
      <div 
        className={`bg-white rounded-2xl border border-slate-200/80 transition-all duration-300 flex flex-col group overflow-hidden cursor-pointer ${cardStateClasses}`}
        onClick={handleCardClick}
      >
        <div className="relative w-full aspect-video bg-slate-100">
          {isSelectionMode && (
            <div className="absolute top-3 left-3 z-10 bg-white/50 p-1 rounded-md">
              <input type="checkbox" checked={isSelected} readOnly className="h-5 w-5 rounded border-slate-400 text-orange-600 focus:ring-orange-500 pointer-events-none"/>
            </div>
          )}
          {imageUrl ? <ImageWithLoader src={imageUrl} alt={styleNames} /> : <div className="w-full h-full bg-slate-100 animate-pulse"></div>}
          {item.isPinned && !isSelectionMode && (
            <div className="absolute top-2 right-2 z-10 p-1.5 bg-orange-500/90 rounded-full shadow-md backdrop-blur-sm" title="Pinned"><Pin className="h-4 w-4 text-white fill-white"/></div>
          )}
          {!isSelectionMode && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2">
              <button onClick={handleViewClick} className="bg-white/90 hover:bg-white text-slate-800 font-semibold px-3 py-2 rounded-lg text-sm shadow-md transition-all duration-200 flex items-center"><Eye className="h-4 w-4 mr-1.5"/>View</button>
              <button onClick={handlePinClick} title={item.isPinned ? 'Unpin' : 'Pin'} className={`font-semibold p-2 rounded-lg text-sm shadow-md transition-all duration-200 flex items-center ${item.isPinned ? 'bg-orange-100 hover:bg-orange-200 text-orange-600' : 'bg-white/90 hover:bg-white text-slate-800'}`}><Pin className={`h-4 w-4 ${item.isPinned ? 'fill-current' : ''}`}/></button>
              <button onClick={handleDeleteClick} className="bg-white/90 hover:bg-white text-red-600 font-semibold p-2 rounded-lg text-sm shadow-md transition-all duration-200 flex items-center" title="Delete"><Trash2 className="h-4 w-4"/></button>
            </div>
          )}
        </div>
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-base capitalize truncate">{styleNames}</h4>
            <p className="text-sm text-slate-500 truncate">{item.climateZone || 'General Climate'}</p>
          </div>
          <span className="text-xs text-slate-400 mt-2 self-start">{new Date(item.timestamp).toLocaleDateString()}</span>
        </div>
      </div>
    );
  }
    
  // List View
  return (
    <div className={`bg-white p-3 rounded-2xl border border-slate-200/80 transition-all duration-300 flex items-center space-x-4 cursor-pointer ${cardStateClasses}`} onClick={handleCardClick}>
      {isSelectionMode && <div className="flex-shrink-0"><input type="checkbox" checked={isSelected} readOnly className="h-5 w-5 rounded border-slate-400 text-orange-600 focus:ring-orange-500 pointer-events-none"/></div>}
      <div className="relative w-32 h-20 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
        {imageUrl ? <ImageWithLoader src={imageUrl} alt={styleNames}/> : <div className="w-full h-full bg-slate-100 animate-pulse"></div>}
        {item.isPinned && <div className="absolute top-1 right-1 z-10 p-1 bg-orange-500/90 rounded-full shadow-sm" title="Pinned"><Pin className="h-3 w-3 text-white fill-white"/></div>}
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="font-bold text-slate-800 text-sm capitalize truncate">{styleNames}</h4>
        <p className="text-sm text-slate-500 truncate">{item.climateZone || 'General Climate'}</p>
        <p className="text-xs text-slate-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
      </div>
      {!isSelectionMode && (
        <div className="flex-shrink-0 flex items-center space-x-1">
          <button onClick={handleViewClick} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="View"><Eye className="h-4 w-4"/></button>
          <button onClick={handlePinClick} title={item.isPinned ? 'Unpin' : 'Pin'} className={`p-2 rounded-lg transition-colors ${item.isPinned ? 'text-orange-500 hover:bg-orange-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}><Pin className={`h-4 w-4 ${item.isPinned ? 'fill-current' : ''}`}/></button>
          <button onClick={handleDeleteClick} title="Delete" className="p-2 rounded-lg text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4"/></button>
        </div>
      )}
    </div>
  );
};
