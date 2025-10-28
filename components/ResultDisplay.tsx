import React from 'react';
import { DesignCatalog } from './DesignCatalog';
import type { DesignCatalog as DesignCatalogType, ImageFile, HydratedHistoryItem } from '../types';
import { Download, Share2, Expand, Wand, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';
import { EngagingLoader } from './EngagingLoader';
import { HistoryGallery } from './HistoryGallery';

interface ResultDisplayProps {
  originalImageFile: ImageFile | null;
  redesignedImage: string | null;
  designCatalog: DesignCatalogType | null;
  isLoading: boolean;
  historyItems?: HydratedHistoryItem[];
  onHistoryItemClick?: (item: HydratedHistoryItem) => void;
  historyLoading?: boolean;
}

const ImageCard: React.FC<{ title: string; imageUrl: string; catalog: DesignCatalogType | null; }> = ({ title, imageUrl, catalog }) => {
    const { openModal } = useAppStore();
    const { addToast } = useToastStore();

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            const blob = await response.blob();
            const mimeType = blob.type;
            const fileExtension = mimeType ? mimeType.split(';')[0].split('/')[1] || 'png' : 'png';
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `redesigned-landscape.${fileExtension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addToast("Download complete!", "success");
        } catch (error) {
            console.error('Download failed:', error);
            addToast("Download failed. Please try again.", "error");
        }
    };
    
    const handleShare = async () => {
        try {
            // Step 1: Fetch the image data URL and convert it into a Blob, then a File object.
            // This is necessary for both the Web Share API and the Clipboard API.
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            const blob = await response.blob();
            const mimeType = blob.type;
            const fileExtension = mimeType ? mimeType.split(';')[0].split('/')[1] || 'png' : 'png';
            const file = new File([blob], `redesigned-landscape.${fileExtension}`, { type: blob.type });

            // Step 2: Attempt to use the Web Share API (Primary Method).
            // This provides the best user experience on supported devices (mostly mobile).
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'AI Landscape Redesign',
                    text: 'Check out this landscape design I created with the AI Redesigner!',
                    files: [file],
                });
                return; // Sharing was successful, so we're done.
            }
            
            // Step 3: If Web Share is unavailable, fall back to the Clipboard API.
            // This allows users on modern desktop browsers to copy the image directly.
            if (navigator.clipboard && navigator.clipboard.write && (window as any).ClipboardItem) {
                try {
                    const clipboardItem = new ClipboardItem({ [blob.type]: blob });
                    await navigator.clipboard.write([clipboardItem]);
                    addToast('Image copied to clipboard!', 'success');
                    return; // Copying was successful, so we're done.
                } catch (copyError) {
                    console.error('Clipboard copy failed, proceeding to final fallback:', copyError);
                    // If copying fails (e.g., user denies permission), we continue to the last resort.
                }
            }

            // Step 4: Final fallback for browsers that support neither method.
            // Inform the user that they need to download the image to share it.
            addToast('Sharing not available. Please download the image to share it.', 'info');

        } catch (err) {
            console.error('Error sharing/copying:', err);
            // Don't show an error toast if the user simply cancels the native share dialog.
            if ((err as Error).name !== 'AbortError') {
                 addToast('An error occurred while preparing the image for sharing.', 'error');
            }
        }
    };
    
    const ActionButton: React.FC<{ onClick: () => void; label: string; icon: React.ReactNode, 'aria-label': string }> = ({ onClick, label, icon, 'aria-label': ariaLabel }) => (
        <button
            onClick={onClick}
            className="bg-white/90 hover:bg-white text-slate-800 font-semibold px-4 py-2 rounded-lg text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
            aria-label={ariaLabel}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 xl:h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            </div>
             <div className="relative group w-full rounded-xl overflow-hidden bg-slate-100">
                 <img src={imageUrl} alt={title} className="w-full h-auto block" />

                 {/* Desktop hover overlay */}
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 sm:gap-4 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex-wrap rounded-xl hidden lg:flex">
                     <ActionButton onClick={() => openModal(imageUrl)} label="Larger" icon={<Expand className="h-4 w-4 mr-2" />} aria-label="View larger" />
                     <ActionButton onClick={handleDownload} label="Download" icon={<Download className="h-4 w-4 mr-2" />} aria-label="Download image" />
                     <ActionButton onClick={handleShare} label="Share" icon={<Share2 className="h-4 w-4 mr-2" />} aria-label="Share image" />
                 </div>

                 {/* Mobile/Tablet: Solid bottom bar - always visible */}
                 <div className="lg:hidden absolute inset-x-0 bottom-0 bg-white border-t border-slate-200 p-3 flex justify-center gap-3">
                     <button onClick={(e) => { e.stopPropagation(); openModal(imageUrl); }} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg text-sm border border-slate-300 shadow-sm" aria-label="View larger">
                         <Expand className="h-4 w-4" />
                         <span className="sm:inline">View</span>
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg text-sm border border-slate-300 shadow-sm" aria-label="Download image">
                         <Download className="h-4 w-4" />
                         <span className="sm:inline">Download</span>
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg text-sm border border-slate-300 shadow-sm" aria-label="Share image">
                         <Share2 className="h-4 w-4" />
                         <span className="sm:inline">Share</span>
                     </button>
                 </div>
              </div>
              {catalog && <DesignCatalog catalog={catalog} />}
         </div>
   );
 };

const Placeholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex items-center justify-center min-h-[400px] w-full xl:min-h-0 xl:h-full">
        <div className="text-center text-slate-500">
            {children}
        </div>
    </div>
);


export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  originalImageFile,
  redesignedImage,
  designCatalog,
  isLoading,
  historyItems,
  onHistoryItemClick,
  historyLoading,
}) => {
  // Debug logging
  console.log('ResultDisplay props:', {
    hasOriginalImage: !!originalImageFile,
    hasRedesignedImage: !!redesignedImage,
    isLoading,
    historyItemsCount: historyItems?.length || 0,
    hasHistoryItemClick: !!onHistoryItemClick,
    historyLoading
  });

  if (isLoading) {
    return <EngagingLoader />;
  }

  if (redesignedImage) {
      return <ImageCard title="Design Preview" imageUrl={redesignedImage} catalog={designCatalog} />;
  }

  if (historyLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex items-center justify-center min-h-[400px] w-full xl:min-h-0 xl:h-full">
        <div className="text-center">
          <div className="animate-spin mx-auto h-8 w-8 border-4 border-slate-200 border-t-slate-600 rounded-full mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-700">Loading your recent designs...</h3>
        </div>
      </div>
    );
  }

  if (historyItems && historyItems.length > 0 && onHistoryItemClick) {
    return <HistoryGallery items={historyItems} onItemClick={onHistoryItemClick} />;
  }

  const PlaceholderContent = !originalImageFile ? (
    <>
      <ImageIcon className="mx-auto h-16 w-16 text-slate-300" strokeWidth={1}/>
      <h3 className="mt-4 text-xl font-semibold text-slate-700">Your design will appear here</h3>
      <p className="mt-1 text-sm text-slate-500">Upload an image and select a style to get started.</p>
    </>
  ) : (
    <>
      <Wand className="mx-auto h-16 w-16 text-slate-400" strokeWidth={1} />
      <h3 className="mt-4 text-xl font-semibold text-slate-700">Ready to Redesign</h3>
      <p className="mt-1 text-sm text-slate-500">{'Click "Generate Redesign" to see the magic happen.'}</p>
    </>
  );

  return (
      <Placeholder>
        {PlaceholderContent}
      </Placeholder>
   );
};