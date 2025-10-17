import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { RotateCcw, Undo, Redo, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface EditingModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (newImageUrl: string) => void;
}

// Helper function to apply edits on a canvas and get a new data URL
const applyEditsAndGetDataUrl = (
  imageUrl: string,
  rotation: number,
  brightness: number,
  contrast: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important for canvas with images from data URLs
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const rads = (rotation * Math.PI) / 180;
      
      const isSwapped = rotation === 90 || rotation === 270;
      const newWidth = isSwapped ? img.height : img.width;
      const newHeight = isSwapped ? img.width : img.height;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(rads);
      
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for editing.'));
    };
    img.src = imageUrl;
  });
};

interface EditState {
  rotation: number;
  brightness: number;
  contrast: number;
}
const INITIAL_STATE: EditState = { rotation: 0, brightness: 100, contrast: 100 };

export const EditingModal: React.FC<EditingModalProps> = ({ isOpen, onClose, imageUrl, onSave }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  
  const [history, setHistory] = useState<EditState[]>([INITIAL_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentEdits, setCurrentEdits] = useState<EditState>(INITIAL_STATE);
  
  const [isSaving, setIsSaving] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useFocusTrap(modalRef);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setHistory([INITIAL_STATE]);
      setHistoryIndex(0);
      setCurrentEdits(INITIAL_STATE);
    }
  }, [isOpen]);

  const commitToHistory = useCallback((newState: EditState) => {
    if (JSON.stringify(newState) === JSON.stringify(history[historyIndex])) {
      return;
    }
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newState]);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex]);

  const handleUndo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentEdits(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentEdits(history[newIndex]);
    }
  };

  const handleRotate = () => {
    const newState = {
      ...currentEdits,
      rotation: (currentEdits.rotation + 90) % 360,
    };
    setCurrentEdits(newState);
    commitToHistory(newState);
  };
  
  const handleReset = () => {
    if (JSON.stringify(INITIAL_STATE) !== JSON.stringify(currentEdits)) {
      setCurrentEdits(INITIAL_STATE);
      commitToHistory(INITIAL_STATE);
    }
  };
  
  const handleSliderChange = useCallback((key: 'brightness' | 'contrast', value: number) => {
    setCurrentEdits(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSliderCommit = useCallback(() => {
    commitToHistory(currentEdits);
  }, [commitToHistory, currentEdits]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    addToast('Applying edits...', 'info');
    try {
      const { rotation, brightness, contrast } = currentEdits;
      const editedImageUrl = await applyEditsAndGetDataUrl(imageUrl, rotation, brightness, contrast);
      onSave(editedImageUrl);
      addToast('Edits saved successfully!', 'success');
      onClose();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addToast(`Failed to save edits: ${errorMessage}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [imageUrl, currentEdits, onSave, onClose, addToast]);

  if (!isOpen) return null;
  
  const imageStyle: React.CSSProperties = {
    transform: `rotate(${currentEdits.rotation}deg)`,
    filter: `brightness(${currentEdits.brightness}%) contrast(${currentEdits.contrast}%)`,
    maxWidth: '80vw',
    maxHeight: '60vh'
  };

  const ActionButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center bg-slate-100/80 border border-slate-200/80 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editing-modal-title"
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-7xl flex flex-col items-stretch"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200/80">
            <h2 id="editing-modal-title" className="text-xl font-bold text-slate-800">Edit Image</h2>
             <button
              onClick={onClose}
              className="text-slate-500 rounded-full h-8 w-8 flex items-center justify-center hover:bg-slate-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
        </header>

        <div className="flex-grow flex items-center justify-center p-8 bg-slate-50 min-h-[300px]">
            <img src={imageUrl} alt="Editing preview" style={imageStyle} className="transition-all duration-200" />
        </div>
        
        <div className="p-6 bg-white border-t border-slate-200/80">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center space-x-4">
                        <label htmlFor="brightness" className="w-20 text-sm font-medium text-slate-700">Brightness</label>
                        <input
                            id="brightness"
                            type="range"
                            min="50"
                            max="150"
                            value={currentEdits.brightness}
                            onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
                            onMouseUp={handleSliderCommit}
                            onTouchEnd={handleSliderCommit}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                        />
                         <span className="w-10 text-center text-sm text-slate-500">{currentEdits.brightness}%</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label htmlFor="contrast" className="w-20 text-sm font-medium text-slate-700">Contrast</label>
                        <input
                            id="contrast"
                            type="range"
                            min="50"
                            max="150"
                            value={currentEdits.contrast}
                            onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
                            onMouseUp={handleSliderCommit}
                            onTouchEnd={handleSliderCommit}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                        />
                        <span className="w-10 text-center text-sm text-slate-500">{currentEdits.contrast}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <ActionButton onClick={handleUndo} disabled={!canUndo}>
                        <Undo className="h-4 w-4 mr-2" />
                        Undo
                    </ActionButton>
                     <ActionButton onClick={handleRedo} disabled={!canRedo}>
                        <Redo className="h-4 w-4 mr-2" />
                        Redo
                    </ActionButton>
                    <ActionButton onClick={handleRotate}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rotate
                    </ActionButton>
                    <ActionButton onClick={handleReset}>
                        Reset
                    </ActionButton>
                </div>
            </div>
             <div className="mt-6 pt-4 border-t border-slate-200/80 flex justify-end space-x-3">
                 <button onClick={onClose} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                 <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="h-10 w-36 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
                 >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : 'Save & Close'}
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};