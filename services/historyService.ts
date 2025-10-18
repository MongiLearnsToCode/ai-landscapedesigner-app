import type { HydratedHistoryItem, ImageFile, DesignCatalog, LandscapingStyle } from '../types';
import * as dbService from './databaseService';

// We'll get the user ID from the auth context in the components
let currentUserId: string | null = null;

export const setCurrentUserId = (userId: string | null) => {
    currentUserId = userId;
};

export const getCurrentUserId = (): string | null => {
    return currentUserId;
};

export const checkRedesignLimit = async () => {
    console.log('🔍 Checking redesign limit for user:', currentUserId);
    if (!currentUserId) {
        console.log('❌ No current user ID, returning 0 remaining');
        return { canRedesign: false, remaining: 0 };
    }
    const result = await dbService.checkRedesignLimit(currentUserId);
    console.log('✅ Limit check result:', result);
    return result;
};

export const getHistory = async (): Promise<HydratedHistoryItem[]> => {
    if (!currentUserId) {
        return [];
    }

    try {
        const redesigns = await dbService.getRedesigns(currentUserId);
        
        return redesigns.map(redesign => ({
            id: redesign.id,
            designCatalog: redesign.designCatalog,
            styles: redesign.styles,
            climateZone: redesign.climateZone || '',
            timestamp: redesign.createdAt.getTime(),
            isPinned: redesign.isPinned,
            originalImageInfo: { id: redesign.id, name: 'Original Image', type: 'image/jpeg' },
            redesignedImageInfo: { id: redesign.id, type: 'image/jpeg' },
            originalImage: { name: 'Original Image', type: 'image/jpeg', base64: '' },
            redesignedImage: redesign.redesignedImageUrl
        }));
    } catch (error) {
        console.error("Failed to fetch history", error);
        return [];
    }
};

export const saveHistoryItemMetadata = async (
    originalImage: ImageFile, 
    redesignedImage: { base64: string; type: string }, 
    catalog: DesignCatalog, 
    styles: LandscapingStyle[], 
    climateZone: string
): Promise<HydratedHistoryItem | null> => {
    if (!currentUserId) {
        throw new Error("Please sign in to save redesigns");
    }

    try {
        const result = await dbService.saveRedesign({
            originalImage,
            redesignedImage,
            catalog,
            styles,
            climateZone,
            userId: currentUserId
        });

        return {
            id: result.id,
            designCatalog: result.designCatalog,
            styles: result.styles,
            climateZone: result.climateZone || '',
            timestamp: result.createdAt.getTime(),
            isPinned: result.isPinned,
            originalImageInfo: { id: result.id, name: originalImage.name, type: originalImage.type },
            redesignedImageInfo: { id: result.id, type: redesignedImage.type },
            originalImage: originalImage,
            redesignedImage: result.redesignedImageUrl
        };
    } catch (error) {
        console.error("Failed to save redesign", error);
        throw error;
    }
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
    try {
        await dbService.deleteRedesign(id);
    } catch (error) {
        console.error("Failed to delete history item", error);
        throw error;
    }
};

export const togglePin = async (id: string): Promise<HydratedHistoryItem[]> => {
    try {
        await dbService.togglePin(id);
        return await getHistory();
    } catch (error) {
        console.error("Failed to toggle pin status", error);
        throw error;
    }
};
