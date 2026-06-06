import type { DesignCatalog, LandscapingStyle, RedesignDensity } from '../types';
import { geminiRateLimiter } from './rateLimit';
import { sanitizeError } from './errorUtils';

type GeminiAction =
  | 'redesignOutdoorSpace'
  | 'getElementImage'
  | 'getElementInfo'
  | 'getReplacementSuggestions'
  | 'validateRedesign';

type RedesignValidation = {
  propertyConsistency: boolean;
  styleAccuracy: boolean;
  aspectRatioCompliance: boolean;
  structuralChangeRules: boolean;
  locationClimateRespect: boolean;
  redesignDensity: boolean;
  authenticityGuard: boolean;
  overallPass: boolean;
  reasons: string[];
};

const callGeminiApi = async <T>(action: GeminiAction, payload: Record<string, unknown>): Promise<T> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || 'AI service request failed');
    }

    return result as T;
  } catch (error) {
    throw new Error(sanitizeError(error));
  }
};

export const redesignOutdoorSpace = async (
  base64Image: string,
  mimeType: string,
  styles: LandscapingStyle[],
  allowStructuralChanges: boolean,
  climateZone: string,
  lockAspectRatio: boolean,
  redesignDensity: RedesignDensity
): Promise<{ base64ImageBytes: string; mimeType: string; catalog: DesignCatalog }> => {
  if (!geminiRateLimiter.checkLimit()) {
    const remainingTime = Math.ceil(geminiRateLimiter.getTimeUntilReset() / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${remainingTime} seconds before trying again.`);
  }

  return callGeminiApi('redesignOutdoorSpace', {
    base64Image,
    mimeType,
    styles,
    allowStructuralChanges,
    climateZone,
    lockAspectRatio,
    redesignDensity,
  });
};

export const getElementImage = async (elementName: string, description?: string): Promise<string> => {
  const result = await callGeminiApi<{ imageUrl: string }>('getElementImage', {
    elementName,
    description,
  });

  return result.imageUrl;
};

export const getElementInfo = async (elementName: string, climateZone?: string): Promise<string> => {
  const result = await callGeminiApi<{ text: string }>('getElementInfo', {
    elementName,
    climateZone,
  });

  return result.text;
};

export const getReplacementSuggestions = async (
  itemName: string,
  styles: LandscapingStyle[],
  climateZone: string
): Promise<string[]> => {
  const result = await callGeminiApi<{ suggestions: string[] }>('getReplacementSuggestions', {
    itemName,
    styles,
    climateZone,
  });

  return result.suggestions;
};

export const validateRedesign = async (
  originalBase64: string,
  originalMimeType: string,
  redesignedBase64: string,
  redesignedMimeType: string,
  styles: LandscapingStyle[],
  allowStructuralChanges: boolean,
  climateZone: string,
  redesignDensity: RedesignDensity
): Promise<RedesignValidation> => {
  return callGeminiApi('validateRedesign', {
    originalBase64,
    originalMimeType,
    redesignedBase64,
    redesignedMimeType,
    styles,
    allowStructuralChanges,
    climateZone,
    redesignDensity,
  });
};
