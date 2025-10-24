import type { HydratedHistoryItem, ImageFile, DesignCatalog, LandscapingStyle } from '../types';

const API_BASE = '/api/history';

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
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'checkRedesignLimit', userId: currentUserId }),
        });
        if (!response.ok) {
            throw new Error(`Failed to check limit: ${response.status}`);
        }
        const result = await response.json();
        console.log('✅ Limit check result:', result);
        return result;
    } catch (error) {
        console.error(`❌ Failed to check redesign limit for user ${currentUserId}:`, error);
        // Return safe default on failure
        return { canRedesign: false, remaining: 0 };
    }
};

export const getHistory = async (): Promise<HydratedHistoryItem[]> => {
    console.log('📋 getHistory called - currentUserId:', currentUserId);
    
    if (!currentUserId) {
        console.log('❌ No currentUserId, returning empty array');
        return [];
    }

    try {
        console.log('📥 Fetching redesigns from database for user:', currentUserId);
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getHistory', userId: currentUserId }),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch history: ${response.status}`);
        }
        const result = await response.json();
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
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveHistoryItem',
                userId: currentUserId,
                originalImage,
                redesignedImage,
                catalog,
                styles,
                climateZone
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to save history item: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Failed to save redesign", error);
        throw error;
    }
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deleteHistoryItem', userId: currentUserId, id }),
        });
        if (!response.ok) {
            throw new Error(`Failed to delete history item: ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to delete history item", error);
        throw error;
    }
};

export const togglePin = async (id: string): Promise<HydratedHistoryItem[]> => {
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'togglePin', userId: currentUserId, id }),
        });
        if (!response.ok) {
            throw new Error(`Failed to toggle pin: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Failed to toggle pin status", error);
        throw error;
    }
};
