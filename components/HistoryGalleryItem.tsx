import React, { useState, useEffect } from 'react';
import type { HydratedHistoryItem } from '../types';
import { getCloudinaryUrl } from '../services/cloudinaryService';
import { LANDSCAPING_STYLES } from '../constants';
import { ImageWithLoader } from './ImageWithLoader';
import { Eye } from 'lucide-react';

interface HistoryGalleryItemProps {
    item: HydratedHistoryItem;
    onClick: (item: HydratedHistoryItem) => void;
}

export const HistoryGalleryItem: React.FC<HistoryGalleryItemProps> = ({ item, onClick }) => {
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

    return (
        <div
            onClick={() => onClick(item)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(item); } }}
            className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer transition-transform duration-300 hover:scale-105 shadow-sm hover:shadow-xl flex flex-col"
            tabIndex={0}
            role="button"
            aria-label={`View design: ${styleNames}`}
        >
            {/* Image section */}
            <div className="flex-grow relative">
                {imageUrl ? (
                    <ImageWithLoader src={imageUrl} alt={styleNames} />
                ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse" />
                )}

                {/* Desktop hover overlay - ONLY on lg+ screens */}
                <div className="hidden lg:flex absolute inset-0 bg-black/40 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-8 w-8 text-white" />
                </div>
            </div>

            {/* Bottom info bar with gradient - always visible */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <h4 className="text-white font-bold text-sm truncate drop-shadow-md">{styleNames}</h4>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-300 drop-shadow-sm">{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Unknown date'}</p>
                    {/* Mobile/Tablet: Always visible View button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(item); }}
                        className="lg:hidden flex items-center gap-1 bg-white/90 hover:bg-white text-slate-800 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-md"
                        aria-label={`View ${styleNames}`}
                    >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">View</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
