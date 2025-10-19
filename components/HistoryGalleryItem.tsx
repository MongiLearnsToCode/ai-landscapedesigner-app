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
            className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer transition-transform duration-300 hover:scale-105 shadow-sm hover:shadow-xl"
            role="button"
            aria-label={`View design: ${styleNames}`}
        >
            {imageUrl ? (
                <ImageWithLoader src={imageUrl} alt={styleNames} />
            ) : (
                <div className="w-full h-full bg-slate-200 animate-pulse" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-white font-bold text-sm truncate drop-shadow-md">{styleNames}</h4>
                <p className="text-xs text-slate-300 drop-shadow-sm">{new Date(item.timestamp).toLocaleDateString()}</p>
            </div>
        </div>
    );
};
