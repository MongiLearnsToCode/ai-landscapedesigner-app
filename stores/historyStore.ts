import { create } from 'zustand';
import * as historyService from '../services/historyService';
import type { HydratedHistoryItem, ImageFile, DesignCatalog, LandscapingStyle } from '../types';
import { useToastStore } from './toastStore';
import { useAppStore } from './appStore';

interface NewRedesignData {
  originalImage: ImageFile;
  redesignedImage: { base64: string; type: string };
  catalog: DesignCatalog;
  styles: LandscapingStyle[];
  climateZone: string;
}

interface HistoryState {
  history: HydratedHistoryItem[];
  isLoading: boolean;
}

interface HistoryActions {
  saveNewRedesign: (data: NewRedesignData) => Promise<void>;
  deleteItem: (id: string) => void;
  deleteMultipleItems: (ids: string[]) => Promise<void>;
  pinItem: (id: string) => void;
  viewFromHistory: (item: HydratedHistoryItem) => void;
  refreshHistory: () => Promise<void>;
  setHistory: (history: HydratedHistoryItem[]) => void;
  setLoading: (isLoading: boolean) => void;
}

type HistoryStore = HistoryState & HistoryActions;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  // Initial state
  history: [],
  isLoading: false,

  // Actions
  setHistory: (history: HydratedHistoryItem[]) => set({ history }),
  setLoading: (isLoading: boolean) => set({ isLoading }),

  refreshHistory: async () => {
    const { isAuthenticated, user } = useAppStore.getState();
    console.log('🔄 refreshHistory called - isAuthenticated:', isAuthenticated, 'user:', user?.id);

    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated or no user, clearing history');
      set({ history: [], isLoading: false });
      return;
    }

    console.log('📥 Starting history fetch for user:', user.id);
    set({ isLoading: true });
    try {
      const historyItems = await historyService.getHistory();
      console.log('✅ History fetched successfully:', historyItems.length, 'items');
      set({ history: historyItems });
    } catch (error) {
      console.error('❌ Failed to fetch history:', error);
      useToastStore.getState().addToast('Failed to load history', 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  saveNewRedesign: async (data: NewRedesignData) => {
    try {
      const result = await historyService.saveHistoryItemMetadata(
        data.originalImage,
        data.redesignedImage,
        data.catalog,
        data.styles,
        data.climateZone
      );

      if (result) {
        await get().refreshHistory();
        useToastStore.getState().addToast("Redesign saved to history!", "success");
      } else {
        throw new Error("Failed to save redesign");
      }
    } catch (err) {
      console.error("Failed to save history item", err);
      useToastStore.getState().addToast("Error saving redesign to history.", "error");
    }
  },

  deleteItem: async (id: string) => {
    try {
      await historyService.deleteHistoryItem(id);
      await get().refreshHistory();
      useToastStore.getState().addToast("Item deleted from history.", "info");
    } catch (err) {
      console.error("Failed to delete history item", err);
      useToastStore.getState().addToast("Error deleting item from history.", "error");
    }
  },

  deleteMultipleItems: async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      for (const id of ids) {
        await historyService.deleteHistoryItem(id);
      }
      await get().refreshHistory();
      useToastStore.getState().addToast(`${ids.length} project${ids.length > 1 ? 's' : ''} deleted.`, "info");
    } catch (err) {
      console.error("Failed to delete multiple history items", err);
      useToastStore.getState().addToast("Error deleting items from history.", "error");
    }
  },

  pinItem: async (id: string) => {
    try {
      const updatedHistory = await historyService.togglePin(id);
      set({ history: updatedHistory });
      const updatedItem = updatedHistory.find(item => item.id === id);
      useToastStore.getState().addToast(updatedItem?.isPinned ? "Item pinned!" : "Item unpinned.", "success");
    } catch (err) {
      console.error("Failed to toggle pin status", err);
      useToastStore.getState().addToast("Error updating pin status.", "error");
    }
  },

  viewFromHistory: (item: HydratedHistoryItem) => {
    const fullItem = {
      ...item,
      originalImage: {
        name: 'Original Image',
        type: 'image/jpeg',
        base64: '',
        url: item.originalImageUrl
      },
      redesignedImage: item.redesignedImageUrl
    } as HydratedHistoryItem;
    useAppStore.getState().loadItem(fullItem);
  },
}));