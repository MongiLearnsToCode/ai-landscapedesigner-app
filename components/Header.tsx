import React, { useState, useRef, useEffect } from 'react';
import { Leaf, User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { Page } from '../contexts/AppContext';

export const Header: React.FC = () => {
  const { navigateTo, page, isAuthenticated, user, logout } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const openMobileMenu = () => {
    setIsMobileMenuMounted(true);
    document.body.style.overflow = 'hidden';
    // A tiny delay allows the element to be in the DOM before the transition class is added
    setTimeout(() => setIsMobileMenuVisible(true), 20);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuVisible(false);
    document.body.style.overflow = '';
    // Unmount the component after the transition is complete
    setTimeout(() => setIsMobileMenuMounted(false), 300);
  };

  const NavLink: React.FC<{ targetPage: Page; children: React.ReactNode }> = ({ targetPage, children }) => {
    const isActive = page === targetPage;
    return (
        <button 
            onClick={() => navigateTo(targetPage)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                ? 'text-slate-900' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
        >
            {children}
        </button>
    );
  };

  const MobileNavLink: React.FC<{ targetPage: Page; children: React.ReactNode }> = ({ targetPage, children }) => {
    const isActive = page === targetPage;
    const handleNavigate = () => {
        navigateTo(targetPage);
        closeMobileMenu();
    };
    return (
        <button
            onClick={handleNavigate}
            className={`w-full text-left px-4 py-3 text-lg font-semibold rounded-lg transition-colors ${
                isActive
                ? 'bg-orange-50 text-orange-600'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
        >
            {children}
        </button>
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <>
      <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-8">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigateTo('main')}
              role="button"
              aria-label="Go to homepage"
            >
              <Leaf className="h-7 w-7 text-orange-500" />
              <h1 className="text-lg font-bold text-slate-800 tracking-wide">AI Landscape Designer</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-2">
              <NavLink targetPage="main">Home</NavLink>
              {isAuthenticated && <NavLink targetPage="history">Projects</NavLink>}
              <NavLink targetPage="pricing">Pricing</NavLink>
              <NavLink targetPage="contact">Contact</NavLink>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <img 
                      src={user.avatarUrl}
                      alt="User profile"
                      className="h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-white ring-slate-200"
                  />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200/80 p-1 z-20">
                    <div className="px-3 py-2 border-b border-slate-200/80">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { navigateTo('profile'); setIsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2 rounded-md text-slate-700"
                    >
                      <UserIcon className="h-4 w-4 text-slate-500" />
                      <span>My Profile</span>
                    </button>
                     <button
                      onClick={() => { logout(); setIsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2 rounded-md text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                 <button 
                  onClick={() => navigateTo('signin')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100/80 transition-colors"
                 >
                  Sign In
                </button>
                <button 
                  onClick={() => navigateTo('signup')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-sm"
                >
                  Sign Up Free
                </button>
              </div>
            )}
            {/* Mobile Menu Button */}
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
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuMounted && (
        <div
            className={`fixed inset-0 bg-slate-900/40 z-40 md:hidden transition-opacity duration-300 ${
              isMobileMenuVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMobileMenu}
            role="dialog"
            aria-modal="true"
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
                  <Leaf className="h-6 w-6 text-orange-500" />
                  <h2 className="font-bold text-slate-800">Menu</h2>
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
            </nav>
            {!isAuthenticated && (
                <div className="p-4 space-y-3 border-t border-slate-200/80">
                    <button
                        onClick={() => { navigateTo('signin'); closeMobileMenu(); }}
                        className="w-full h-11 text-center font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { navigateTo('signup'); closeMobileMenu(); }}
                        className="w-full h-11 text-center font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm"
                    >
                        Sign Up Free
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};