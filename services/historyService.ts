import type { HydratedHistoryItem, ImageFile, DesignCatalog, LandscapingStyle } from '../types';
import * as dbService from './databaseService';
import { getDeviceFingerprint } from './fingerprintService';

export const setCurrentUserId = (userId: string) => {
    // Not needed anymore - using fingerprint
};

export const getCurrentUserId = (): string | null => {
    return getDeviceFingerprint();
};

export const checkRedesignLimit = async () => {
    return await dbService.checkRedesignLimit();
};

export const getHistory = async (): Promise<HydratedHistoryItem[]> => {
    try {
        const redesigns = await dbService.getRedesigns();
        
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
    try {
        const result = await dbService.saveRedesign({
            originalImage,
            redesignedImage,
            catalog,
            styles,
            climateZone,
            userId: getDeviceFingerprint()
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
