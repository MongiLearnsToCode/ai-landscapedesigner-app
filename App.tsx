import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Header } from './components/Header';
import { Modal } from './components/Modal';
import { DesignerPage } from './pages/DesignerPage';
import { HistoryPage } from './pages/HistoryPage';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { FairUsePolicyPage } from './pages/FairUsePolicyPage';
import { SuccessPage } from './pages/SuccessPage';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { useAppStore, type Page } from './stores/appStore';
import { useHistoryStore } from './stores/historyStore';
import { setCurrentUserId, setOnUserIdChangeCallback } from './services/historyService';
import { ensureUserExists } from './services/databaseService';

const AuthInitializer: React.FC = () => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { setUser, setAuthenticated, navigateTo, page } = useAppStore();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser) {
      setCurrentUserId(clerkUser.id);

      const user = {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        avatarUrl: clerkUser.imageUrl || `https://i.pravatar.cc/150?u=${clerkUser.id}`,
        subscription: {
          plan: 'Free' as const,
          status: 'active' as const,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      };

      setUser(user);
      setAuthenticated(true);
    } else {
      setCurrentUserId(null);
      setUser(null);
      setAuthenticated(false);
    }
  }, [isLoaded, isSignedIn, clerkUser, setUser, setAuthenticated]);

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      const name = clerkUser.fullName || clerkUser.firstName || 'User';
      ensureUserExists(clerkUser.id, email, name);

      // Navigate to main page after successful sign-in
      if (page === 'signin' || page === 'signup') {
        navigateTo('main');
      }
    }
  }, [isLoaded, isSignedIn, clerkUser, navigateTo]);

  return null;
};

const PageContent: React.FC = () => {
  const { page, isModalOpen, modalImage, closeModal, navigateTo, isAuthenticated, user } = useAppStore();
  const { history, pinItem, deleteItem, viewFromHistory, refreshHistory, setHistory } = useHistoryStore();

  // Hash change effect
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as Page;
      const validPages: Page[] = ['main', 'history', 'pricing', 'contact', 'terms', 'privacy', 'signin', 'signup', 'profile', 'reset-password', 'fairuse', 'success'];
      const newPage = validPages.includes(hash) ? hash : 'main';
      useAppStore.getState().navigateTo(newPage);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // History refresh effects
  useEffect(() => {
    setOnUserIdChangeCallback(() => {
      console.log('🔄 User ID changed, refreshing history');
      refreshHistory();
    });

    return () => {
      setOnUserIdChangeCallback(null);
    };
  }, [refreshHistory]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Small delay to ensure user ID is properly set
      const timer = setTimeout(() => {
        console.log('🔄 Auto-refreshing history after authentication change');
        refreshHistory();
      }, 100);
      return () => clearTimeout(timer);
    } else if (!isAuthenticated) {
      // Clear history when user logs out
      setHistory([]);
    }
  }, [isAuthenticated, user, refreshHistory, setHistory]);

  useEffect(() => {
    const baseTitle = 'AI Landscape Designer';
    let pageTitle = page.charAt(0).toUpperCase() + page.slice(1);
    if (page === 'main') pageTitle = 'Home';
    if (page === 'history') pageTitle = 'Projects';
    if (page === 'fairuse') pageTitle = 'Fair Use Policy';

    document.title = `${baseTitle} | ${pageTitle}`;
  }, [page]);

  // Protected Routes Logic
  useEffect(() => {
    if (!isAuthenticated && (page === 'history' || page === 'profile')) {
      navigateTo('signin');
    }
  }, [isAuthenticated, page, navigateTo]);

  const pages: { [key: string]: React.ReactNode } = {
    main: <DesignerPage />,
    history: isAuthenticated ? <HistoryPage historyItems={history} onView={viewFromHistory} onPin={pinItem} onDelete={deleteItem} /> : null,
    pricing: <PricingPage onNavigate={navigateTo} />,
    contact: <ContactPage />,
    terms: <TermsPage />,
    privacy: <PrivacyPage />,
    signin: <SignInPage />,
    signup: <SignUpPage />,
    profile: isAuthenticated ? <ProfilePage /> : null,
    'reset-password': <ResetPasswordPage />,
    fairuse: <FairUsePolicyPage />,
    success: <SuccessPage />,
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans p-2 sm:p-4 lg:p-6 xl:p-8 flex flex-col">
      <div className="w-full flex-grow mx-auto bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg ring-1 ring-black/5 flex flex-col">
        <Header />
        <main className="p-3 sm:p-4 lg:p-6 xl:p-8 flex-grow overflow-y-auto flex flex-col">
          {pages[page] || <DesignerPage />}
        </main>
        <Footer />
      </div>
      {isModalOpen && modalImage && <Modal imageUrl={modalImage} onClose={closeModal} />}
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthInitializer />
      <PageContent />
    </ErrorBoundary>
  );
};

export default App;