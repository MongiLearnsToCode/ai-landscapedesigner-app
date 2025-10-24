import type { HydratedHistoryItem, ImageFile, DesignCatalog, LandscapingStyle } from '../types';

// We'll get the user ID from the auth context in the components
// When a user signs in, setCurrentUserId is called, and the HistoryContext
// automatically fetches the user's history from the Neon database
let currentUserId: string | null = null;
let onUserIdChangeCallback: (() => void) | null = null;

export const setCurrentUserId = (userId: string | null) => {
    console.log('🆔 setCurrentUserId called:', { 
        oldUserId: currentUserId, 
        newUserId: userId 
    });
    const wasChanged = currentUserId !== userId;
    currentUserId = userId;
    
    // Trigger callback if user ID changed and we have a callback
    if (wasChanged && onUserIdChangeCallback && userId) {
        console.log('🔄 Triggering user ID change callback');
        setTimeout(onUserIdChangeCallback, 100); // Small delay to ensure everything is set up
    }
};

export const setOnUserIdChangeCallback = (callback: (() => void) | null) => {
    console.log('📞 Setting user ID change callback:', !!callback);
    onUserIdChangeCallback = callback;
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
    const { checkRedesignLimit: checkLimit } = await import('./databaseService');
    const result = await checkLimit(currentUserId);
    console.log('✅ Limit check result:', result);
    return result;
};

export const getHistory = async (): Promise<HydratedHistoryItem[]> => {
    console.log('📋 getHistory called - currentUserId:', currentUserId);
    
    if (!currentUserId) {
        console.log('❌ No currentUserId, returning empty array');
        return [];
    }

    try {
        console.log('📥 Fetching redesigns from database for user:', currentUserId);
        const { getRedesigns } = await import('./databaseService');
        const redesigns = await getRedesigns(currentUserId);
        console.log('✅ Database returned', redesigns.length, 'redesigns');
        
        // Sanitize responses to minimize data exposure
        const result = redesigns.map(redesign => ({
            id: redesign.id,
            designCatalog: redesign.designCatalog,
            styles: redesign.styles,
            climateZone: redesign.climateZone || '',
            timestamp: redesign.createdAt.getTime(),
            isPinned: redesign.isPinned,
            // Remove unnecessary nested objects and empty fields
            originalImageUrl: redesign.originalImageUrl,
            redesignedImageUrl: redesign.redesignedImageUrl
        }));
        
        console.log('✅ Returning', result.length, 'processed history items');
        return result;
    } catch (error) {
        console.error("❌ Failed to fetch history", error);
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
        const { saveRedesign } = await import('./databaseService');
        const result = await saveRedesign({
            originalImage,
            redesignedImage,
            catalog,
            styles,
            climateZone,
            userId: currentUserId
        });

        // Sanitize response to minimize data exposure
        return {
            id: result.id,
            designCatalog: result.designCatalog,
            styles: result.styles,
            climateZone: result.climateZone || '',
            timestamp: result.createdAt.getTime(),
            isPinned: result.isPinned,
            // Only include essential URLs, remove full image objects
            originalImageUrl: result.originalImageUrl,
            redesignedImageUrl: result.redesignedImageUrl
        };
    } catch (error) {
        console.error("Failed to save redesign", error);
        throw error;
    }
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
    try {
        const { deleteRedesign } = await import('./databaseService');
        await deleteRedesign(id);
    } catch (error) {
        console.error("Failed to delete history item", error);
        throw error;
    }
};

export const togglePin = async (id: string): Promise<HydratedHistoryItem[]> => {
    try {
        const { togglePin: toggle } = await import('./databaseService');
        await toggle(id);
        return await getHistory();
    } catch (error) {
        console.error("Failed to toggle pin status", error);
        throw error;
    }
};
