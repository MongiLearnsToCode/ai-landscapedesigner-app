import type { HydratedHistoryItem, ImageFile, DesignCatalog, LandscapingStyle } from '../types';
import { uploadImageToCloudinary } from './cloudinaryService';

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
        const response = await fetch(`/api/users/redesign-limit?userId=${currentUserId}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Limit check result:', data);

        return {
            canRedesign: data.canRedesign,
            remaining: data.remaining,
        };
    } catch (error) {
        console.error('❌ Error checking redesign limit:', error);
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
        console.log('📥 Fetching redesigns from API for user:', currentUserId);
        const response = await fetch(`/api/history?userId=${currentUserId}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ API returned', data.redesigns?.length || 0, 'redesigns');

        // Transform to HydratedHistoryItem format
        const result = (data.redesigns || []).map((item: any) => ({
            id: item.id,
            designCatalog: item.designCatalog,
            styles: typeof item.styles === 'string' ? JSON.parse(item.styles) : item.styles,
            climateZone: item.climateZone,
            timestamp: item.createdAt,
            isPinned: item.isPinned,
            originalImageUrl: item.originalImageUrl,
            redesignedImageUrl: item.redesignedImageUrl
        }));

        console.log('✅ Returning', result.length, 'processed history items');
        return result;
    } catch (error) {
        console.error("❌ Failed to fetch history from API", error);
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
        // Step 1: Upload images to Cloudinary
        console.log('📤 Uploading images to Cloudinary...');
        const originalUrl = await uploadImageToCloudinary(originalImage);
        const redesignedUrl = await uploadImageToCloudinary({ base64: redesignedImage.base64, type: redesignedImage.type, name: 'redesigned' });

        console.log('✅ Images uploaded successfully');

        // Step 2: Save metadata to database via API
        console.log('💾 Saving to database via API...');
        const response = await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUserId,
                originalImageUrl: originalUrl,
                redesignedImageUrl: redesignedUrl,
                catalog,
                styles,
                climateZone,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ History item saved via API');

        return result.redesign;
    } catch (error) {
        console.error('❌ Error saving history item:', error);
        throw error;
    }
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
    if (!currentUserId) {
        throw new Error('No user logged in');
    }

    console.log('🗑️ Deleting history item:', id);

    try {
        const response = await fetch(`/api/history/${id}?userId=${currentUserId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✅ History item deleted via API');
    } catch (error) {
        console.error('❌ Error deleting history item:', error);
        throw error;
    }
};

export const togglePin = async (id: string): Promise<HydratedHistoryItem[]> => {
    if (!currentUserId) {
        throw new Error('No user logged in');
    }

    console.log('📌 Toggling pin for item:', id);

    try {
        const response = await fetch(`/api/history/${id}/pin?userId=${currentUserId}`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✅ Pin toggled via API');

        // Refresh and return updated history
        return await getHistory();
    } catch (error) {
        console.error('❌ Error toggling pin:', error);
        throw error;
    }
};
