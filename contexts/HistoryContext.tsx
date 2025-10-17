import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as historyService from '../services/historyService';
import type { HydratedHistoryItem, ImageFile, DesignCatalog, LandscapingStyle } from '../types';
import { useToast } from './ToastContext';
import { useApp } from './AppContext';


interface NewRedesignData {
    originalImage: ImageFile;
    redesignedImage: { base64: string; type: string };
    catalog: DesignCatalog;
    styles: LandscapingStyle[];
    climateZone: string;
}

interface HistoryContextType {
  history: HydratedHistoryItem[];
  saveNewRedesign: (data: NewRedesignData) => Promise<void>;
  deleteItem: (id: string) => void;
  deleteMultipleItems: (ids: string[]) => Promise<void>;
  pinItem: (id: string) => void;
  viewFromHistory: (item: HydratedHistoryItem) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HydratedHistoryItem[]>([]);
  const { addToast } = useToast();
  const { loadItem } = useApp();

  // Use app context for authentication state
  const { isAuthenticated } = useApp();

  // Authentication is handled by AppContext
  // User ID is set automatically in AppContext when user changes

  const refreshHistory = useCallback(async () => {
    const historyItems = await historyService.getHistory();
    setHistory(historyItems);
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const saveNewRedesign = useCallback(async (data: NewRedesignData) => {
    try {
      // Call the updated service function that handles image uploads and saves to backend
      const result = await historyService.saveHistoryItemMetadata(
        data.originalImage,
        data.redesignedImage,
        data.catalog,
        data.styles,
        data.climateZone
      );
      
      if (result) {
        // Refresh the history
        await refreshHistory();
        addToast("Redesign saved to history!", "success");
      } else {
        throw new Error("Failed to save redesign");
      }
    } catch (err) {
        console.error("Failed to save history item", err);
        addToast("Error saving redesign to history.", "error");
    }
  }, [refreshHistory, addToast]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await historyService.deleteHistoryItem(id);
      await refreshHistory();
      addToast("Item deleted from history.", "info");
    } catch (err) {
      console.error("Failed to delete history item", err);
      addToast("Error deleting item from history.", "error");
    }
  }, [addToast, refreshHistory]);

  const deleteMultipleItems = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    
    // In our backend implementation, we only have a single delete endpoint
    // So we'll loop through and delete each item individually
    try {
      for (const id of ids) {
        await historyService.deleteHistoryItem(id);
      }
      await refreshHistory();
      addToast(`${ids.length} project${ids.length > 1 ? 's' : ''} deleted.`, "info");
    } catch (err) {
      console.error("Failed to delete multiple history items", err);
      addToast("Error deleting items from history.", "error");
    }
  }, [addToast, refreshHistory]);

  const pinItem = useCallback(async (id: string) => {
    try {
      const updatedHistory = await historyService.togglePin(id);
      setHistory(updatedHistory);
      // Find the updated item to determine if it's pinned
      const updatedItem = updatedHistory.find(item => item.id === id);
      addToast(updatedItem?.isPinned ? "Item pinned!" : "Item unpinned.", "success");
    } catch (err) {
      console.error("Failed to toggle pin status", err);
      addToast("Error updating pin status.", "error");
    }
  }, [addToast]);

  const viewFromHistory = useCallback(async (item: HydratedHistoryItem) => {
    // In a backend implementation, we would fetch the full image data from the backend
    // For now, we'll pass the item as-is since in a real implementation the image data
    // would already be part of the backend response
    loadItem(item);
  }, [loadItem]);

  const value = {
    history,
    saveNewRedesign,
    deleteItem,
    deleteMultipleItems,
    pinItem,
    viewFromHistory,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};