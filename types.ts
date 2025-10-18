// FIX: Removed self-import for `DesignCatalog`.
// FIX: Removed conflicting self-import of 'ImageFile'.
export interface ImageFile {
  name: string;
  type: string;
  base64: string;
  url?: string; // Optional Cloudinary URL for saved images
}

export type LandscapingStyle = 'modern' | 'minimalist' | 'rustic' | 'mediterranean' | 'japanese' | 'tropical' | 'farmhouse' | 'coastal' | 'desert' | 'urban-modern' | 'bohemian' | 'english-cottage';
export type RedesignDensity = 'default' | 'minimal' | 'lush';

export interface StyleOption {
    id: LandscapingStyle;
    name: string;
    description: string;
}

export interface Plant {
    name: string;
    species: string;
}

export interface Feature {
    name: string;
    description: string;
    imageUrl?: string;
}

export interface DesignCatalog {
    plants: Plant[];
    features: Feature[];
}

// FIX: Add RefinementModifications type for customization modal.
export interface RefinementModifications {
  deletions: string[];
  replacements: { from: string; to: string }[];
  additions: string[];
}

// Represents the metadata stored in localStorage (without large image data)
export interface HistoryItem {
    id: string;
    designCatalog: DesignCatalog;
    styles: LandscapingStyle[];
    climateZone: string;
    timestamp: number;
    isPinned: boolean;
    originalImageInfo: { id: string; name: string; type: string; storagePath?: string; cloudinaryPublicId?: string };
    redesignedImageInfo: { id: string; type: string; storagePath?: string; cloudinaryPublicId?: string };
}

// Represents a fully loaded history item, with image data fetched from IndexedDB
export interface HydratedHistoryItem extends HistoryItem {
    originalImage: ImageFile;
    redesignedImage: string; // This will be the full data URL for the component
}


export type ToastMessage = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

// Defines the structure for a user account
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  subscription: {
    plan: 'Personal' | 'Creator' | 'Business' | 'Free';
    status: 'active' | 'canceled' | 'trialing';
    nextBillingDate: string;
  };
}
