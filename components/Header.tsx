import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Menu, X, Cog, LogOut } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useAppStore, type Page } from '../stores/appStore';
import { useShallow } from 'zustand/react/shallow';

const pagePath: Record<Page, string> = {
  main: '/',
  history: '/history',
  pricing: '/pricing',
  contact: '/contact',
  terms: '/terms',
  privacy: '/privacy',
  signin: '/signin',
  signup: '/signup',
  settings: '/settings',
  'reset-password': '/reset-password',
  'fair-use-policy': '/fair-use-policy',
  success: '/success',
};

const FOCUSABLE_SELECTORS = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Header: React.FC = () => {
  const { navigateTo, page, isAuthenticated, user, logout } = useAppStore(
    useShallow((state) => ({
      navigateTo: state.navigateTo,
      page: state.page,
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      logout: state.logout,
    }))
  );
  const { signOut } = useAuthActions();
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const plan = user?.subscription.plan || 'Free';
  const isPaidPlan = plan !== 'Free';

  const openMobileMenu = () => {
    setIsMobileMenuMounted(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => setIsMobileMenuVisible(true), 20);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuVisible(false);
    document.body.style.overflow = '';
    setTimeout(() => setIsMobileMenuMounted(false), 300);
  };

  useEffect(() => {
    if (!isMobileMenuMounted) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const focusFirstMenuControl = () => {
      const focusableElements = Array.from(
        mobileMenuRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) || []
      );
      focusableElements[0]?.focus();
    };

    const focusTimer = window.setTimeout(focusFirstMenuControl, 50);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        mobileMenuRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) || []
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement?.focus();
    };
  }, [isMobileMenuMounted]);

  const handleSignOut = async () => {
    await signOut();
    logout();
    navigateTo('main');
  };

  const NavLink: React.FC<{ targetPage: Page; children: React.ReactNode }> = ({ targetPage, children }) => {
    const isActive = page === targetPage;
    return (
      <Link
        to={pagePath[targetPage]}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'text-slate-900'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
      </Link>
    );
  };

  const MobileNavLink: React.FC<{ targetPage: Page; children: React.ReactNode }> = ({ targetPage, children }) => {
    const isActive = page === targetPage;
    const handleNavigate = () => {
      closeMobileMenu();
    };
    return (
      <Link
        to={pagePath[targetPage]}
        onClick={handleNavigate}
        className={`w-full text-left px-4 py-3 text-lg font-semibold rounded-lg transition-colors ${
          isActive
            ? 'bg-orange-50 text-orange-600'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
      </Link>
    );
  };

  const PlanBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${
        isPaidPlan
          ? 'border-orange-200 bg-orange-50 text-orange-700'
          : 'border-slate-200 bg-slate-50 text-slate-600'
      } ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}
    >
      {plan}
    </span>
  );

  return (
    <>
      <header className="px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-2 cursor-pointer"
              aria-label="Go to homepage"
            >
              <Leaf className="h-6 w-6 sm:h-7 sm:w-7 text-orange-500" aria-hidden="true" />
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-wide portrait:sm:hidden">
                AI Landscape Designer
              </h1>
              <h1 className="text-base font-bold text-slate-800 tracking-wide hidden portrait:sm:block">
                AI Landscape
              </h1>
            </Link>
            <nav className="hidden md:flex items-center space-x-2">
              <NavLink targetPage="main">Home</NavLink>
              {isAuthenticated && <NavLink targetPage="history">Projects</NavLink>}
              <NavLink targetPage="pricing">Pricing</NavLink>
              <NavLink targetPage="contact">Contact</NavLink>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/settings"
                  className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                  title="Account Settings"
                >
                  <Cog className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="hidden sm:flex items-center space-x-2 mr-2">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full ring-2 ring-orange-500/20"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{user.name}</span>
                      <PlanBadge compact />
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/signin"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100/80 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
            <div className="flex md:hidden">
              <button
                onClick={openMobileMenu}
                className="p-2 text-slate-600 hover:text-slate-900"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuMounted && (
        <div
          className={`fixed inset-0 bg-slate-900/40 z-40 md:hidden transition-opacity duration-300 ${
            isMobileMenuVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-title"
        >
          <div
            ref={mobileMenuRef}
            className={`fixed top-0 left-0 right-0 bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out ${
              isMobileMenuVisible ? 'translate-y-0' : '-translate-y-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200/80">
              <div className="flex items-center space-x-2">
                <Leaf className="h-6 w-6 text-orange-500" aria-hidden="true" />
                <h2 id="mobile-navigation-title" className="font-bold text-slate-800">Menu</h2>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-slate-500 hover:text-slate-900"
                aria-label="Close navigation menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              <MobileNavLink targetPage="main">Home</MobileNavLink>
              {isAuthenticated && <MobileNavLink targetPage="history">Projects</MobileNavLink>}
              <MobileNavLink targetPage="pricing">Pricing</MobileNavLink>
              <MobileNavLink targetPage="contact">Contact</MobileNavLink>
              {isAuthenticated && <MobileNavLink targetPage="settings">Settings</MobileNavLink>}
            </nav>
            {isAuthenticated && user ? (
              <div className="p-4 border-t border-slate-200/80">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-10 w-10 rounded-full ring-2 ring-orange-500/20"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{user.name}</p>
                      <PlanBadge />
                    </div>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { handleSignOut(); closeMobileMenu(); }}
                  className="w-full h-11 flex items-center justify-center space-x-2 text-center font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
	              <div className="p-4 space-y-3 border-t border-slate-200/80">
	                <Link
	                  to="/signin"
	                  onClick={closeMobileMenu}
	                  className="flex w-full h-11 items-center justify-center text-center font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
	                >
	                  Sign In
	                </Link>
	                <Link
	                  to="/signup"
	                  onClick={closeMobileMenu}
	                  className="flex w-full h-11 items-center justify-center text-center font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-sm"
	                >
	                  Sign Up Free
	                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
