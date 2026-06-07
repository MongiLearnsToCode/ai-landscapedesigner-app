import React, { useState, useCallback } from 'react';
import type { DesignCatalog as DesignCatalogType, Plant, Feature } from '../types';
import { Sprout, Sofa, Clipboard, ChevronDown, Loader2, Download, Share2, FileText, ImageDown } from 'lucide-react';
import { useToastStore } from '../stores/toastStore';
import { getElementImage, getElementInfo } from '../services/geminiService';
import { sanitizeError } from '../services/errorUtils';

interface DesignCatalogProps {
  catalog: DesignCatalogType | null;
}

interface ElementDetail {
  isLoading: boolean;
  imageUrl?: string;
  info?: string;
  error?: string;
}

const getBriefDescription = (item: Plant | Feature): string => (
  'species' in item ? item.species : item.description
);

const slugify = (value: string): string => (
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'design-element'
);

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getImageBlob = async (imageUrl: string): Promise<Blob> => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new Error('Image file is empty');
  }
  return blob;
};

const buildElementText = (item: Plant | Feature, detail?: ElementDetail): string => {
  const lines = [
    item.name,
    '',
    `Brief description: ${getBriefDescription(item)}`,
  ];

  if (detail?.info) {
    lines.push('', 'Longer description:', detail.info);
  }

  return lines.join('\n').trim();
};

const ExpandedDetailView: React.FC<{
  item: Plant | Feature;
  detail: ElementDetail;
  onDownloadImage: (item: Plant | Feature, detail: ElementDetail) => void;
  onDownloadText: (item: Plant | Feature, detail: ElementDetail) => void;
  onShare: (item: Plant | Feature, detail: ElementDetail) => void;
}> = ({ item, detail, onDownloadImage, onDownloadText, onShare }) => {
  if (detail.isLoading) {
    return (
      <div className="p-4 flex items-center justify-center text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Loading details…</span>
      </div>
    );
  }

  if (detail.error) {
    return <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md">{detail.error}</div>;
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      <div className="md:col-span-1">
        {detail.imageUrl ? (
	          <img src={detail.imageUrl} alt={item.name} loading="lazy" decoding="async" className="rounded-lg object-cover w-full aspect-square bg-slate-100" />
        ) : (
          <div className="rounded-lg w-full aspect-square bg-slate-200 animate-pulse" />
        )}
      </div>
      <div className="md:col-span-2">
        <p className="text-sm text-slate-700 whitespace-pre-line">{detail.info || 'No additional information available.'}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onDownloadImage(item, detail)}
            disabled={!detail.imageUrl}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImageDown className="h-4 w-4" />
            Image
          </button>
          <button
            type="button"
            onClick={() => onDownloadText(item, detail)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            Details
          </button>
          <button
            type="button"
            onClick={() => onShare(item, detail)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export const DesignCatalog: React.FC<DesignCatalogProps> = ({ catalog }) => {
  const { addToast } = useToastStore();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [elementDetails, setElementDetails] = useState<Record<string, ElementDetail>>({});

  const hasPlants = catalog?.plants && catalog.plants.length > 0;
  const hasFeatures = catalog?.features && catalog.features.length > 0;

  const getCompactListText = useCallback(() => {
    if (!catalog || (!hasPlants && !hasFeatures)) return '';

    let text = "";
    if (hasPlants) {
      text += "Plants & Flora:\n";
      catalog.plants.forEach(p => { text += `- ${p.name} (${p.species})\n`; });
    }

    if (hasFeatures) {
      if (hasPlants) text += "\n";
      text += "Furniture & Features:\n";
      catalog.features.forEach(f => { text += `- ${f.name}: ${f.description}\n`; });
    }

    return text.trim();
  }, [catalog, hasPlants, hasFeatures]);

  const handleCopy = useCallback(() => {
    const textToCopy = getCompactListText();
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      addToast("Design list copied to clipboard!", "success");
    }).catch(() => {
      addToast("Failed to copy list.", "error");
    });
  }, [getCompactListText, addToast]);

  const handleDownloadList = useCallback(() => {
    const textToDownload = getCompactListText();
    if (!textToDownload) return;

    downloadBlob(new Blob([textToDownload], { type: 'text/plain;charset=utf-8' }), 'design-elements.txt');
    addToast("Design list downloaded.", "success");
  }, [getCompactListText, addToast]);

  const handleDownloadImage = useCallback(async (item: Plant | Feature, detail: ElementDetail) => {
    if (!detail.imageUrl) return;

    try {
      const blob = await getImageBlob(detail.imageUrl);
      const extension = blob.type.split('/')[1] || 'png';
      downloadBlob(blob, `${slugify(item.name)}.${extension}`);
      addToast("Element image downloaded.", "success");
    } catch (error) {
      console.error('Element image download failed:', error);
      addToast("Failed to download image.", "error");
    }
  }, [addToast]);

  const handleDownloadText = useCallback((item: Plant | Feature, detail: ElementDetail) => {
    downloadBlob(
      new Blob([buildElementText(item, detail)], { type: 'text/plain;charset=utf-8' }),
      `${slugify(item.name)}-details.txt`
    );
    addToast("Element details downloaded.", "success");
  }, [addToast]);

  const handleShareElement = useCallback(async (item: Plant | Feature, detail: ElementDetail) => {
    const text = buildElementText(item, detail);

    try {
      if (detail.imageUrl) {
        const blob = await getImageBlob(detail.imageUrl);
        const extension = blob.type.split('/')[1] || 'png';
        const file = new File([blob], `${slugify(item.name)}.${extension}`, { type: blob.type || 'image/png' });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: item.name,
            text,
            files: [file],
          });
          return;
        }
      }

      if (navigator.share) {
        await navigator.share({
          title: item.name,
          text,
        });
        return;
      }

      await navigator.clipboard.writeText(text);
      addToast("Element details copied to clipboard.", "success");
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('Element share failed:', error);
      addToast("Failed to share element.", "error");
    }
  }, [addToast]);

  const handleItemClick = useCallback(async (itemName: string) => {
    const isExpanding = expandedItem !== itemName;
    setExpandedItem(isExpanding ? itemName : null);

    if (isExpanding && !elementDetails[itemName]) {
      setElementDetails(prev => ({ ...prev, [itemName]: { isLoading: true } }));
      try {
        const allItems = [...(catalog?.plants || []), ...(catalog?.features || [])];
        const clickedItem = allItems.find(i => i.name === itemName);
        const description = clickedItem ? getBriefDescription(clickedItem) : undefined;

        const imagePromise = (clickedItem && 'imageUrl' in clickedItem && clickedItem.imageUrl)
          ? Promise.resolve(clickedItem.imageUrl)
          : getElementImage(itemName, description);

        const [imageUrl, info] = await Promise.all([
          imagePromise,
          getElementInfo(description ? `${itemName} (${description})` : itemName, undefined, 'long'),
        ]);
        setElementDetails(prev => ({ ...prev, [itemName]: { isLoading: false, imageUrl, info } }));
      } catch (error) {
        console.error(`Failed to fetch details for ${itemName}:`, error);
        const sanitizedMessage = sanitizeError(error);
        setElementDetails(prev => ({ ...prev, [itemName]: { isLoading: false, error: sanitizedMessage } }));
        addToast(`Error loading details for ${itemName}.`, 'error');
      }
    }
  }, [expandedItem, elementDetails, addToast, catalog]);

  if (!hasPlants && !hasFeatures) {
    return null;
  }

  const renderItemList = (
    items: (Plant | Feature)[],
    isExpandable: boolean
  ) => (
    <ul className="space-y-2">
      {items.map((item) => {
        const isExpanded = expandedItem === item.name;
        const content = (
          <div>
            <p className="font-medium text-sm text-slate-800">{item.name}</p>
            <p className="text-xs text-slate-500">{getBriefDescription(item)}</p>
          </div>
        );

        if (isExpandable) {
          return (
            <li key={item.name} className="rounded-lg bg-slate-100/80 transition-shadow hover:shadow-sm overflow-hidden">
              <button
                onClick={() => handleItemClick(item.name)}
                className="w-full text-left p-3 flex justify-between items-center"
                aria-expanded={isExpanded}
                aria-controls={`details-${slugify(item.name)}`}
              >
                {content}
                <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isExpanded && elementDetails[item.name] && (
                <div id={`details-${slugify(item.name)}`} className="border-t border-slate-200/80">
                  <ExpandedDetailView
                    item={item}
                    detail={elementDetails[item.name]}
                    onDownloadImage={handleDownloadImage}
                    onDownloadText={handleDownloadText}
                    onShare={handleShareElement}
                  />
                </div>
              )}
            </li>
          );
        }

        return (
          <li key={item.name} className="rounded-lg bg-slate-100/80 overflow-hidden">
            <div className="w-full text-left p-3 flex justify-between items-center">
              {content}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4 gap-3">
        <h4 className="text-base font-semibold text-slate-800">
          Design Elements
        </h4>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadList}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Download className="h-4 w-4 mr-1.5" />
            List
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Clipboard className="h-4 w-4 mr-1.5" />
            Copy List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasPlants && (
          <section>
            <h5 className="text-sm font-semibold text-slate-700 flex items-center mb-3">
              <Sprout className="h-4 w-4 mr-2 text-green-500" />
              Plants & Flora
            </h5>
            {renderItemList(catalog.plants, true)}
          </section>
        )}
        {hasFeatures && (
          <section>
            <h5 className="text-sm font-semibold text-slate-700 flex items-center mb-3">
              <Sofa className="h-4 w-4 mr-2 text-amber-600" />
              Furniture & Features
            </h5>
            {renderItemList(catalog.features, true)}
          </section>
        )}
      </div>
    </div>
  );
};
