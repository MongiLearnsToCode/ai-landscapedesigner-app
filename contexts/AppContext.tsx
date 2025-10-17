import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import type { HydratedHistoryItem, User } from '../types';
import { setCurrentUserId } from '../services/historyService';

export type Page = 'main' | 'history' | 'pricing' | 'contact' | 'terms' | 'privacy' | 'signin' | 'signup' | 'profile' | 'reset-password' | 'fairuse' | 'success';

// Mock user data for frontend-only demonstration
const MOCK_USER: User = {
  id: 'user123',
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=user123',
  subscription: {
    plan: 'Creator',
    status: 'active',
    nextBillingDate: '2024-12-31',
  },
};

interface AppContextType {
  page: Page;
  navigateTo: (page: Page) => void;
  isModalOpen: boolean;
  modalImage: string | null;
  openModal: (imageUrl: string) => void;
  closeModal: () => void;
  itemToLoad: HydratedHistoryItem | null;
  onItemLoaded: () => void;
  loadItem: (item: HydratedHistoryItem) => void;
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  upgradeSubscription: (plan: User['subscription']['plan']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [page, setPage] = useState<Page>('main');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [itemToLoad, setItemToLoad] = useState<HydratedHistoryItem | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Simulate checking auth status on load
  useEffect(() => {
    const checkAuth = () => {
      // In a real app, you'd check a token here.
      // We'll simulate being logged out by default.
      const storedAuth = sessionStorage.getItem('isAuthenticated');
      if (storedAuth === 'true') {
        setUser(MOCK_USER);
        setIsAuthenticated(true);
        // Set the user ID in the history service for backend requests
        setCurrentUserId(MOCK_USER.id);
      }
    };
    checkAuth();
  }, []);
  
  const navigateTo = (page: Page) => {
    setPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const openModal = (imageUrl: string) => {
    setModalImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImage(null);
  };

  const loadItem = (item: HydratedHistoryItem) => {
    setItemToLoad(item);
    navigateTo('main');
  };

  const onItemLoaded = useCallback(() => {
    setItemToLoad(null);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuthenticated', 'true');
    // Set the user ID in the history service for backend requests
    setCurrentUserId(userData.id);
    navigateTo('main');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuthenticated');
    // Clear the user ID in the history service
    setCurrentUserId(null);
    navigateTo('main');
  };

  const upgradeSubscription = useCallback((plan: User['subscription']['plan']) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      // Return a new user object to trigger state update
      return {
        ...currentUser,
        subscription: {
          ...currentUser.subscription,
          plan: plan,
          status: 'active' as const,
        }
      };
    });
  }, []);

  const value = {
    page,
    navigateTo,
    isModalOpen,
    modalImage,
    openModal,
    closeModal,
    itemToLoad,
    onItemLoaded,
    loadItem,
    isAuthenticated,
    user,
    login,
    logout,
    upgradeSubscription,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};