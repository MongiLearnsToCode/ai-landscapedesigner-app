import { create } from 'zustand';
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
  deleteItem: (id: string) => Promise<void>;
  deleteMultipleItems: (ids: string[]) => Promise<void>;
  pinItem: (id: string) => Promise<void>;
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

    set({ isLoading: false });
  },

  saveNewRedesign: async (data: NewRedesignData) => {
    const newItem: HydratedHistoryItem = {
      id: `local-${Date.now()}`,
      originalImageUrl: data.originalImage.url || '',
      redesignedImageUrl: `data:${data.redesignedImage.type};base64,${data.redesignedImage.base64}`,
      originalImage: data.originalImage,
      redesignedImage: `data:${data.redesignedImage.type};base64,${data.redesignedImage.base64}`,
      designCatalog: data.catalog,
      styles: data.styles,
      climateZone: data.climateZone,
      timestamp: Date.now(),
      isPinned: false,
    };
    set((state) => ({ history: [newItem, ...state.history] }));
  },

  deleteItem: async (id: string) => {
    set((state) => ({ history: state.history.filter((item) => item.id !== id) }));
  },

  deleteMultipleItems: async (ids: string[]) => {
    if (ids.length === 0) return;

    const idsToDelete = new Set(ids);
    set((state) => ({ history: state.history.filter((item) => !idsToDelete.has(item.id)) }));
  },

  pinItem: async (id: string) => {
    set((state) => ({
      history: state.history.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      ),
    }));
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
