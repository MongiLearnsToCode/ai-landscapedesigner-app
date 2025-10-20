import { create } from 'zustand';
import type { HydratedHistoryItem, User } from '../types';

export type Page = 'main' | 'history' | 'pricing' | 'contact' | 'terms' | 'privacy' | 'signin' | 'signup' | 'profile' | 'reset-password' | 'fairuse' | 'success';

interface AppState {
  page: Page;
  isModalOpen: boolean;
  modalImage: string | null;
  itemToLoad: HydratedHistoryItem | null;
  isAuthenticated: boolean;
  user: User | null;
}

interface AppActions {
  navigateTo: (page: Page) => void;
  openModal: (imageUrl: string) => void;
  closeModal: () => void;
  loadItem: (item: HydratedHistoryItem) => void;
  onItemLoaded: () => void;
  login: (user: User) => void;
  logout: () => void;
  upgradeSubscription: (plan: User['subscription']['plan']) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setUser: (user: User | null) => void;
}

type AppStore = AppState & AppActions;

const getInitialPage = (): Page => {
  const hash = window.location.hash.slice(1) as Page;
  const validPages: Page[] = ['main', 'history', 'pricing', 'contact', 'terms', 'privacy', 'signin', 'signup', 'profile', 'reset-password', 'fairuse', 'success'];
  return validPages.includes(hash) ? hash : 'main';
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  page: getInitialPage(),
  isModalOpen: false,
  modalImage: null,
  itemToLoad: null,
  isAuthenticated: false,
  user: null,

  // Actions
  navigateTo: (page: Page) => {
    set({ page });
    window.location.hash = page === 'main' ? '' : page;
    window.scrollTo(0, 0);
  },

  openModal: (imageUrl: string) => {
    set({ modalImage: imageUrl, isModalOpen: true });
  },

  closeModal: () => {
    set({ isModalOpen: false, modalImage: null });
  },

  loadItem: (item: HydratedHistoryItem) => {
    set({ itemToLoad: item });
    get().navigateTo('main');
  },

  onItemLoaded: () => {
    set({ itemToLoad: null });
  },

  login: (user: User) => {
    set({ user, isAuthenticated: true });
    get().navigateTo('main');
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    get().navigateTo('main');
  },

  upgradeSubscription: (plan: User['subscription']['plan']) => {
    console.log(`Upgrading to ${plan} plan`);
    // Update user subscription if user exists
    set((state) => ({
      user: state.user ? {
        ...state.user,
        subscription: { ...state.user.subscription, plan }
      } : null
    }));
  },

  setAuthenticated: (isAuthenticated: boolean) => {
    set({ isAuthenticated });
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },
}));