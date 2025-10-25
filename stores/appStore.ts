import { create } from 'zustand';
import type { HydratedHistoryItem, User } from '../types';

export type Page = 'main' | 'history' | 'pricing' | 'contact' | 'terms' | 'privacy' | 'signin' | 'signup' | 'profile' | 'reset-password' | 'fair-use-policy' | 'success';

interface AppState {
  page: Page;
  navigate: ((path: string) => void) | null;
  isModalOpen: boolean;
  modalImage: string | null;
  itemToLoad: HydratedHistoryItem | null;
  isAuthenticated: boolean;
  user: User | null;
}

interface AppActions {
  navigateTo: (pageOrPath: string) => void;
  setNavigate: (navigate: (path: string) => void) => void;
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

export const pathToPage: Record<string, Page> = {
  '/': 'main',
  '/history': 'history',
  '/pricing': 'pricing',
  '/contact': 'contact',
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/signin': 'signin',
  '/signup': 'signup',
  '/profile': 'profile',
  '/reset-password': 'reset-password',
  '/fair-use-policy': 'fair-use-policy',
  '/success': 'success',
};

const getInitialPage = (): Page => {
  const path = window.location.pathname;
  return pathToPage[path] || 'main';
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  page: getInitialPage(),
  navigate: null,
  isModalOpen: false,
  modalImage: null,
  itemToLoad: null,
  isAuthenticated: false,
  user: null,

  // Actions
  setNavigate: (navigate: (path: string) => void) => {
    set({ navigate });
  },

  navigateTo: (pageOrPath: string) => {
    let path: string;
    let page: Page;
    if (pageOrPath.startsWith('/')) {
      path = pageOrPath;
      page = pathToPage[path] || 'main';
    } else {
      page = pageOrPath as Page;
      path = page === 'main' ? '/' : `/${page}`;
    }
    set({ page });
    get().navigate?.(path);
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