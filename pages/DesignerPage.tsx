import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { StyleSelector } from '../components/StyleSelector';
import { ClimateZoneSection } from '../components/ClimateZoneSection';
import { ResultDisplay } from '../components/ResultDisplay';
import { redesignOutdoorSpace, validateRedesign } from '../services/geminiService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { LANDSCAPING_STYLES } from '../constants';
import type { LandscapingStyle, ImageFile, DesignCatalog, RedesignDensity } from '../types';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';
import { useShallow } from 'zustand/react/shallow';
import { sanitizeError } from '../services/errorUtils';
import { DensitySelector } from '../components/DensitySelector';

import { useUser } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

interface RedesignError {
  message: string;
  suggestion?: 'style';
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = React.memo<SectionProps>(function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-4">{title}</h2>
      {children}
    </div>
  );
});

// Define the shape of the state we want to persist
interface DesignerState {
  originalImage: ImageFile | null;
  selectedStyles: LandscapingStyle[];
  allowStructuralChanges: boolean;
  climateZone: string;
  lockAspectRatio: boolean;
  redesignDensity: RedesignDensity;
}

const getInitialState = (): DesignerState => {
  try {
    const savedState = localStorage.getItem('designerSession');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Backwards compatibility for old state with `selectedStyle`
      if (parsed.selectedStyle && !parsed.selectedStyles) {
        parsed.selectedStyles = [parsed.selectedStyle];
        delete parsed.selectedStyle;
      }
      return {
        lockAspectRatio: true,
        redesignDensity: 'default',
        ...parsed,
        // Ensure selectedStyles exists and is not an empty array after parsing
        selectedStyles: (parsed.selectedStyles && parsed.selectedStyles.length > 0) ? parsed.selectedStyles : [LANDSCAPING_STYLES[0].id],
      };
    }
    // FIX: Added curly braces to the catch block to fix a syntax error.
  } catch (error) {
    console.error("Could not parse designer session state from localStorage", error);
  }
  return {
    originalImage: null,
    selectedStyles: [LANDSCAPING_STYLES[0].id],
    allowStructuralChanges: false,
    climateZone: '',
    lockAspectRatio: true,
    redesignDensity: 'default',
  };
};

export const DesignerPage: React.FC = () => {
  const { itemToLoad, onItemLoaded, isAuthenticated, navigateTo, page } = useAppStore(
    useShallow((state) => ({
      itemToLoad: state.itemToLoad,
      onItemLoaded: state.onItemLoaded,
      isAuthenticated: state.isAuthenticated,
      navigateTo: state.navigateTo,
      page: state.page,
    }))
  );

  const { addToast } = useToastStore(
    useShallow((state) => ({ addToast: state.addToast }))
  );
  const { user: clerkUser } = useUser();

  // Convex hooks
  const saveRedesignMutation = useMutation(api.redesigns.saveRedesign);
  const checkLimitQuery = useQuery(api.redesigns.checkLimit, clerkUser ? { clerkUserId: clerkUser.id } : undefined);

  // Update remaining from Convex
  useEffect(() => {
    if (checkLimitQuery) {
      setRemainingRedesigns(checkLimitQuery.remaining);
    }
  }, [checkLimitQuery]);

  const styleSelectorRef = useRef<HTMLDivElement>(null);

  const [designerState, setDesignerState] = useState<DesignerState>(getInitialState);
  const { originalImage, selectedStyles, allowStructuralChanges, climateZone, lockAspectRatio, redesignDensity } = designerState;

  const [redesignedImage, setRedesignedImage] = useState<string | null>(null);
  const [designCatalog, setDesignCatalog] = useState<DesignCatalog | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<RedesignError | null>(null);
  const [remainingRedesigns, setRemainingRedesigns] = useState<number>(3);
  const hasRequestedInitialHistory = useRef(false);

  // Reset history request flag when authentication state changes
  useEffect(() => {
    hasRequestedInitialHistory.current = false;
  }, [isAuthenticated]);





  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('designerSession', JSON.stringify(designerState));
  }, [designerState]);
  
  // Load item from history
  useEffect(() => {
    if (itemToLoad) {
      const newState: DesignerState = {
        originalImage: itemToLoad.originalImage,
        selectedStyles: itemToLoad.styles,
        allowStructuralChanges: false, // This is not saved in history, default to false
        climateZone: itemToLoad.climateZone,
        lockAspectRatio: true, // Not saved in history, default to true for quality
        redesignDensity: 'default', // Not saved, default
      };
      setDesignerState(newState);
      setRedesignedImage(itemToLoad.redesignedImage);
      setDesignCatalog(itemToLoad.designCatalog);
      setError(null);
      onItemLoaded();
    }
  }, [itemToLoad, onItemLoaded]);



  const handleImageUpload = (file: ImageFile | null) => {
    setDesignerState(prev => ({ ...prev, originalImage: file }));
    setRedesignedImage(null);
    setDesignCatalog(null);
    setError(null);
  };

  const handleClimateChange = useCallback((val: string) => {
    setDesignerState(prev => ({ ...prev, climateZone: val }));
  }, []);

  const handleGenerateRedesign = useCallback(async () => {
    if (!originalImage) {
      setError({ message: "Please upload an image first." });
      return;
    }

    // Redirect unauthenticated users to sign-in page
    if (!isAuthenticated) {
      navigateTo('signin');
      return;
    }

    // Check limit before proceeding
    if (!checkLimitQuery) {
      setError({ message: "Unable to check redesign limit." });
      return;
    }
    if (checkLimitQuery.hasReachedLimit) {
      setError({ message: "You have reached the maximum limit of 3 redesigns per device." });
      return;
    }

    setIsLoading(true);
    setError(null);
    setRedesignedImage(null);
    setDesignCatalog(null);

    const MAX_RETRIES = 2;
    let lastValidationError: Error | null = null;

    try {
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          if (i > 0) {
            addToast(
              `The AI is retrying to produce a valid redesign (${i}/${MAX_RETRIES -1}) — please hold on while we ensure your redesign matches your property and preferences.`,
              'info'
            );
          }

          const result = await redesignOutdoorSpace(
            originalImage.base64,
            originalImage.type,
            selectedStyles,
            allowStructuralChanges,
            climateZone,
            lockAspectRatio,
            redesignDensity
          );

          const validation = await validateRedesign(
            originalImage.base64,
            originalImage.type,
            result.base64ImageBytes,
            result.mimeType,
            selectedStyles,
            allowStructuralChanges,
            climateZone,
            redesignDensity
          );

          if (validation.overallPass) {
            // Upload images to Cloudinary
            const [originalUpload, redesignedUpload] = await Promise.all([
              uploadImageToCloudinary(originalImage),
              uploadImageToCloudinary({
                base64: result.base64ImageBytes,
                type: result.mimeType,
                name: `redesigned_${Date.now()}`
              })
            ]);

            const redesignId = `redesign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await saveRedesignMutation({
              clerkUserId: clerkUser!.id,
              redesignId,
              originalImageUrl: originalUpload.secure_url,
              redesignedImageUrl: redesignedUpload.secure_url,
              designCatalog: result.catalog,
              styles: selectedStyles,
              climateZone,
            });

            const newRemaining = checkLimitQuery ? checkLimitQuery.remaining : 0;
            setRemainingRedesigns(newRemaining);

            setRedesignedImage(`data:${result.mimeType};base64,${result.base64ImageBytes}`);
            setDesignCatalog(result.catalog);
            localStorage.removeItem('designerSession');
            lastValidationError = null; 
            break;
          } else {
            const reasons = validation.reasons.join('; ');
            lastValidationError = new Error(`Redesign validation failed: ${reasons}.`);
          }
        } catch (err) {
          lastValidationError = err as Error;
        }
      }

      if (lastValidationError) {
        if (lastValidationError?.message?.toLowerCase().includes('validation failed')) {
          setError({
            message: "It seems the AI is struggling to produce a valid redesign with your current style settings. Try selecting a different style — or just one style — to help the AI focus and improve results.",
            suggestion: 'style'
          });
        } else {
          throw lastValidationError;
        }
      }
    } catch (err) {
      const sanitizedMessage = sanitizeError(err);
      console.error("Redesign failed:", err);
      setError({ message: `Failed to generate redesign. ${sanitizedMessage}` });
      addToast(`Redesign failed: ${sanitizedMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, selectedStyles, allowStructuralChanges, climateZone, lockAspectRatio, redesignDensity, addToast, isAuthenticated, navigateTo]);



  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 xl:items-start gap-4 sm:gap-6 lg:gap-8">
      <div className="xl:col-span-1 bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6 h-fit">
        <Section title="Upload Your Space">
            <ImageUploader onImageUpload={handleImageUpload} initialImage={originalImage} />
        </Section>
        
        <Section title="Choose Your Style">
            <div ref={styleSelectorRef}>
                <StyleSelector
                    selectedStyles={selectedStyles}
                    onStylesChange={(styles) => setDesignerState(prev => ({ ...prev, selectedStyles: styles }))}
                    allowStructuralChanges={allowStructuralChanges}
                    onAllowStructuralChanges={(allow) => setDesignerState(prev => ({ ...prev, allowStructuralChanges: allow }))}
                    lockAspectRatio={lockAspectRatio}
                    onLockAspectRatioChange={(lock) => setDesignerState(prev => ({ ...prev, lockAspectRatio: lock }))}
                />
            </div>
        </Section>

        <ClimateZoneSection value={climateZone} onChange={handleClimateChange} />

        <Section title="Set Redesign Density">
            <DensitySelector value={redesignDensity} onChange={(val) => setDesignerState(prev => ({ ...prev, redesignDensity: val }))} />
        </Section>
        
        <div>
            <button
              onClick={handleGenerateRedesign}
              disabled={!originalImage || isLoading || (!isAuthenticated ? false : remainingRedesigns === 0)}
              className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {redesignedImage ? 'Refining...' : 'Redesigning...'}
                </>
              ) : (
                !isAuthenticated ? 'Sign up or sign in to get free designs' : 
                remainingRedesigns === 0 ? 'Limit Reached' : 'Generate Redesign'
              )}
            </button>
            {isAuthenticated && (
              <p className="text-xs text-center mt-2 text-slate-500">
                {remainingRedesigns} redesign{remainingRedesigns !== 1 ? 's' : ''} remaining
              </p>
            )}
        </div>
         {error && (
          <div className="text-red-600 text-sm mt-2 text-center">
            <p>{error.message}</p>
            {error.suggestion === 'style' && (
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => {
                    styleSelectorRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Try a different style
                </button>
                <button
                  onClick={() => {
                    const styleId = selectedStyles.length > 0 ? selectedStyles[0] : LANDSCAPING_STYLES[0].id;
                    setDesignerState(prev => ({ ...prev, selectedStyles: [styleId] }));
                  }}
                  className="text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Use a single style
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="xl:col-span-2 flex flex-col">
        <ResultDisplay
          originalImageFile={originalImage}
          redesignedImage={redesignedImage}
          designCatalog={designCatalog}
          isLoading={isLoading}
          historyItems={[]}
          onHistoryItemClick={() => {}}
          historyLoading={false}
        />
      </div>
    </div>
  );
};