

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { X, Trash2, Replace, Plus, RotateCw, Loader2, Wand } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { getReplacementSuggestions } from '../services/geminiService';
import type { DesignCatalog, LandscapingStyle, RefinementModifications, Plant, Feature } from '../types';

// Props definition
interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (modifications: RefinementModifications, newAdditions: Addition[]) => Promise<void>;
  designCatalog: DesignCatalog;
  styles: LandscapingStyle[];
  climateZone: string;
}

// Sub-component for showing suggestions
const ReplacementSuggestions: React.FC<{
  itemName: string;
  styles: LandscapingStyle[];
  climateZone: string;
  onSelect: (newValue: string) => void;
}> = ({ itemName, styles, climateZone, onSelect }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchSuggestions = async () => {
      setIsLoading(true);
      const result = await getReplacementSuggestions(itemName, styles, climateZone);
      if (isMounted) {
        setSuggestions(result);
        setIsLoading(false);
      }
    };
    fetchSuggestions();
    return () => { isMounted = false; };
  }, [itemName, styles, climateZone]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customValue.trim()) {
      onSelect(customValue.trim());
    }
  };

  return (
    <div className="mt-2 p-3 bg-slate-100 rounded-lg">
      <p className="text-xs font-semibold text-slate-600 mb-2">Replace with:</p>
      {isLoading ? (
        <div className="flex items-center justify-center p-2">
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          <span className="ml-2 text-sm text-slate-500">Getting ideas...</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestions.map((suggestion, index) => (
            <button key={index} onClick={() => onSelect(suggestion)} className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Or type a custom replacement"
          className="flex-grow w-full h-8 px-2 py-1 text-xs text-slate-800 bg-white border border-slate-300 rounded-md outline-none transition-all duration-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
        />
        <button type="submit" className="h-8 px-3 text-xs font-semibold bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors">
          Use
        </button>
      </form>
    </div>
  );
};

interface Addition {
  name: string;
  description: string;
}

// Main component
export const CustomizationModal: React.FC<CustomizationModalProps> = ({ isOpen, onClose, imageUrl, onSave, designCatalog, styles, climateZone }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const [deletions, setDeletions] = useState<string[]>([]);
  const [replacements, setReplacements] = useState<{ from: string; to: string }[]>([]);
  const [additions, setAdditions] = useState<Addition[]>([]);
  
  const [newAdditionName, setNewAdditionName] = useState('');
  const [newAdditionDesc, setNewAdditionDesc] = useState('');
  const [itemToReplace, setItemToReplace] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useFocusTrap(modalRef);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Reset state on open
      setDeletions([]);
      setReplacements([]);
      setAdditions([]);
      setNewAdditionName('');
      setNewAdditionDesc('');
      setItemToReplace(null);
      setIsSaving(false);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setIsSaving(true);
    // Format additions back to strings for the API
    const formattedAdditions = additions.map(a => 
      a.description ? `${a.name} (${a.description})` : a.name
    );
    const modifications: RefinementModifications = { 
      deletions, 
      replacements, 
      additions: formattedAdditions 
    };
    try {
        await onSave(modifications, additions);
        // Parent component will handle closing
    } catch (e) {
        setIsSaving(false); // only reset if save fails and modal stays open
    }
  };

  const handleAddAddition = () => {
    const trimmedName = newAdditionName.trim();
    if (trimmedName && !additions.some(a => a.name.toLowerCase() === trimmedName.toLowerCase())) {
      setAdditions([...additions, { name: trimmedName, description: newAdditionDesc.trim() }]);
      setNewAdditionName('');
      setNewAdditionDesc('');
    } else if (trimmedName) {
      addToast(`'${trimmedName}' has already been added.`, 'info');
    }
  };

  const handleRemoveAddition = (additionNameToRemove: string) => {
    setAdditions(additions.filter(a => a.name !== additionNameToRemove));
  };
  
  const allItems = [
    ...(designCatalog?.plants || []).map(p => ({ ...p, type: 'plant' as const })),
    ...(designCatalog?.features || []).map(f => ({ ...f, type: 'feature' as const }))
  ];

  const renderItem = (item: (Plant | Feature) & { type: 'plant' | 'feature' }) => {
    const originalName = item.name;
    const isDeleted = deletions.includes(originalName);
    const replacement = replacements.find(r => r.from === originalName);

    const handleUndo = () => {
      if (isDeleted) {
        setDeletions(deletions.filter(d => d !== originalName));
      }
      if (replacement) {
        setReplacements(replacements.filter(r => r.from !== originalName));
      }
    };
    
    if (isDeleted) {
      return (
        <div key={originalName} className="p-2 bg-red-50 border-l-4 border-red-300 rounded-r-md flex justify-between items-center">
          <p className="text-sm text-red-700 line-through">{originalName}</p>
          <button onClick={handleUndo} className="p-1 rounded-full text-slate-500 hover:bg-slate-200" title="Undo Delete">
            <RotateCw className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (replacement) {
      return (
        <div key={originalName} className="p-2 bg-sky-50 border-l-4 border-sky-300 rounded-r-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500 line-through">{originalName}</p>
              <p className="text-sm font-semibold text-slate-800">→ {replacement.to}</p>
            </div>
            <button onClick={handleUndo} className="p-1 rounded-full text-slate-500 hover:bg-slate-200" title="Undo Replacement">
              <RotateCw className="h-3 w-3" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={originalName} className="p-2 rounded-md bg-slate-50">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-slate-800">{originalName}</p>
          <div className="flex items-center space-x-1">
            <button onClick={() => setItemToReplace(originalName)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200" title="Replace">
              <Replace className="h-4 w-4" />
            </button>
            <button onClick={() => setDeletions([...deletions, originalName])} className="p-1.5 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {itemToReplace === originalName && (
          <ReplacementSuggestions 
            itemName={originalName}
            styles={styles}
            climateZone={climateZone}
            onSelect={(newValue) => {
              setReplacements([...replacements.filter(r => r.from !== originalName), { from: originalName, to: newValue }]);
              setItemToReplace(null);
            }}
          />
        )}
      </div>
    );
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="customization-modal-title">
      <div ref={modalRef} className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-slate-200/80">
          <h2 id="customization-modal-title" className="text-xl font-bold text-slate-800 flex items-center"><Wand className="h-5 w-5 mr-2 text-orange-500" />Customize Design</h2>
          <button onClick={onClose} className="text-slate-500 rounded-full h-8 w-8 flex items-center justify-center hover:bg-slate-100/80 transition-colors" aria-label="Close editor">
            <X className="w-5 w-5" />
          </button>
        </header>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
          <div className="relative h-full w-full bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
            <img src={imageUrl} alt="Customization preview" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <section>
              <h3 className="text-base font-semibold text-slate-800 mb-3">Current Elements</h3>
              <div className="space-y-2">
                {allItems.length > 0 ? allItems.map(renderItem) : <p className="text-sm text-slate-500">No elements listed in the current design.</p>}
              </div>
            </section>
            <section>
              <h3 className="text-base font-semibold text-slate-800 mb-3">Add New Elements</h3>
                <div className="space-y-2">
                    <input 
                        type="text" 
                        value={newAdditionName} 
                        onChange={(e) => setNewAdditionName(e.target.value)} 
                        placeholder="Element name (e.g., Bird bath)" 
                        className="w-full h-10 px-3 py-2 text-sm text-slate-800 bg-slate-100/80 border border-transparent rounded-lg outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200" 
                    />
                    <textarea 
                        value={newAdditionDesc} 
                        onChange={(e) => setNewAdditionDesc(e.target.value)} 
                        placeholder="Optional: Add a brief description (e.g., 'made of stone, classical style')" 
                        rows={2} 
                        className="w-full px-3 py-2 text-sm text-slate-800 bg-slate-100/80 border border-transparent rounded-lg outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200" 
                    />
                    <button onClick={handleAddAddition} className="w-full h-10 px-4 bg-slate-800 text-white font-semibold rounded-lg text-sm hover:bg-slate-900 transition-colors flex items-center justify-center">
                        <Plus className="h-4 w-4 mr-1.5" /> Add Element
                    </button>
                </div>
              {additions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {additions.map(addition => (
                    <div key={addition.name} className="p-2 bg-green-50 border-l-4 border-green-300 rounded-r-md flex justify-between items-center">
                        <div>
                            <p className="text-sm text-green-800 font-medium">{addition.name}</p>
                            {addition.description && <p className="text-xs text-green-700 italic">"{addition.description}"</p>}
                        </div>
                      <button onClick={() => handleRemoveAddition(addition.name)} className="p-1 rounded-full text-slate-500 hover:bg-slate-200" title="Remove Addition">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <footer className="flex-shrink-0 flex justify-end items-center p-4 border-t border-slate-200/80 space-x-3">
          <button onClick={onClose} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="h-10 w-36 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg">
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Refine Design'}
          </button>
        </footer>
      </div>
    </div>
  );
};