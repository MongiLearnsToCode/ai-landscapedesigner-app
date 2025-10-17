import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import type { HydratedHistoryItem, User } from '../types';
import { setCurrentUserId } from '../services/historyService';
import { useSession } from '../lib/auth-client';

export type Page = 'main' | 'history' | 'pricing' | 'contact' | 'terms' | 'privacy' | 'signin' | 'signup' | 'profile' | 'reset-password' | 'fairuse' | 'success';

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
  
  const { data: session, isPending } = useSession();
  const isAuthenticated = !!session?.user && !isPending;
  const user = session?.user ? {
    id: session.user.id,
    name: session.user.name || 'User',
    email: session.user.email,
    avatarUrl: session.user.image || `https://i.pravatar.cc/150?u=${session.user.id}`,
    subscription: {
      plan: 'Free' as const,
      status: 'active' as const,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  } : null;

  useEffect(() => {
    if (session?.user) {
      setCurrentUserId(session.user.id);
    } else {
      setCurrentUserId(null);
    }
  }, [session]);
  
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

  const login = () => {
    navigateTo('main');
  };

  const logout = () => {
    navigateTo('main');
  };

  const upgradeSubscription = useCallback((plan: User['subscription']['plan']) => {
    // In a real app, this would make an API call to update the subscription
    console.log('Upgrading subscription to:', plan);
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