


import React, { useState, useCallback } from 'react';
import type { DesignCatalog as DesignCatalogType, Plant, Feature } from '../types';
import { Sprout, Sofa, Clipboard, ChevronDown, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { getElementImage, getElementInfo } from '../services/geminiService';

interface DesignCatalogProps {
  catalog: DesignCatalogType | null;
}

interface ElementDetail {
  isLoading: boolean;
  imageUrl?: string;
  info?: string;
  error?: string;
}

// Sub-component for the expanded view, showing image and info
const ExpandedDetailView: React.FC<{ detail: ElementDetail }> = ({ detail }) => {
  if (detail.isLoading) {
    return (
      <div className="p-4 flex items-center justify-center text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Loading details...</span>
      </div>
    );
  }

  if (detail.error) {
    return <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md">{detail.error}</div>;
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
      <div className="md:col-span-1">
        {detail.imageUrl ? (
          <img src={detail.imageUrl} alt="Element detail" className="rounded-lg object-cover w-full aspect-square bg-slate-100" />
        ) : (
          <div className="rounded-lg w-full aspect-square bg-slate-200 animate-pulse" />
        )}
      </div>
      <div className="md:col-span-2 text-sm text-slate-700">
        <p>{detail.info || 'No additional information available.'}</p>
      </div>
    </div>
  );
};


export const DesignCatalog: React.FC<DesignCatalogProps> = ({ catalog }) => {
  const { addToast } = useToast();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [elementDetails, setElementDetails] = useState<Record<string, ElementDetail>>({});

  const hasPlants = catalog?.plants && catalog.plants.length > 0;
  const hasFeatures = catalog?.features && catalog.features.length > 0;

  const handleCopy = useCallback(() => {
    if (!catalog || (!hasPlants && !hasFeatures)) return;
    
    let textToCopy = "";
    if (hasPlants) {
        textToCopy += "Plants & Flora:\n";
        catalog.plants.forEach(p => { textToCopy += `- ${p.name} (${p.species})\n`; });
    }

    if (hasFeatures) {
        if (hasPlants) textToCopy += "\n";
        textToCopy += "Furniture & Features:\n";
        catalog.features.forEach(f => { textToCopy += `- ${f.name}: ${f.description}\n`; });
    }
    
    navigator.clipboard.writeText(textToCopy.trim()).then(() => {
      addToast("Design list copied to clipboard!", "success");
    }).catch(err => {
      addToast("Failed to copy list.", "error");
    });
  }, [catalog, hasPlants, hasFeatures, addToast]);

  const handleItemClick = useCallback(async (itemName: string) => {
    const isExpanding = expandedItem !== itemName;
    setExpandedItem(isExpanding ? itemName : null);

    if (isExpanding && !elementDetails[itemName]) {
      setElementDetails(prev => ({ ...prev, [itemName]: { isLoading: true } }));
      try {
        const allItems = [...(catalog?.plants || []), ...(catalog?.features || [])];
        const clickedItem = allItems.find(i => i.name === itemName);

        // Use existing image URL for features if available, otherwise generate a new one.
        const imagePromise = (clickedItem && 'imageUrl' in clickedItem && clickedItem.imageUrl)
            ? Promise.resolve(clickedItem.imageUrl)
            : getElementImage(itemName);
            
        const [imageUrl, info] = await Promise.all([
          imagePromise,
          getElementInfo(itemName),
        ]);
        setElementDetails(prev => ({ ...prev, [itemName]: { isLoading: false, imageUrl, info } }));
      } catch (error) {
        console.error(`Failed to fetch details for ${itemName}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Could not load details.";
        setElementDetails(prev => ({ ...prev, [itemName]: { isLoading: false, error: errorMessage } }));
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
            <p className="text-xs text-slate-500">{'species' in item ? item.species : item.description}</p>
          </div>
        );

        if (isExpandable) {
          return (
            <li key={item.name} className="rounded-lg bg-slate-100/80 transition-shadow hover:shadow-sm overflow-hidden">
              <button
                onClick={() => handleItemClick(item.name)}
                className="w-full text-left p-3 flex justify-between items-center"
                aria-expanded={isExpanded}
                aria-controls={`details-${item.name.replace(/\s+/g, '-')}`}
              >
                {content}
                <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isExpanded && elementDetails[item.name] && (
                <div id={`details-${item.name.replace(/\s+/g, '-')}`} className="border-t border-slate-200/80">
                  <ExpandedDetailView detail={elementDetails[item.name]} />
                </div>
              )}
            </li>
          );
        } else {
          return (
            <li key={item.name} className="rounded-lg bg-slate-100/80 overflow-hidden">
              <div className="w-full text-left p-3 flex justify-between items-center">
                {content}
              </div>
            </li>
          );
        }
      })}
    </ul>
  );


  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-base font-semibold text-slate-800">
          Design Elements
        </h4>
        <button
          onClick={handleCopy}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <Clipboard className="h-4 w-4 mr-1.5" />
          Copy List
        </button>
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