import React, { useEffect } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
import { SettingsPage } from './pages/SettingsPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { FairUsePolicyPage } from './pages/FairUsePolicyPage';
import { SuccessPage } from './pages/SuccessPage';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { useAppStore, type Page, pathToPage } from './stores/appStore';
import { useQuery, useMutation } from 'convex/react';
import { api } from './convex/_generated/api';
import { processConvexHistory } from './src/utils/historyUtils';
import type { User } from './types';

const AuthInitializer: React.FC = () => {
  const { signOut } = useAuthActions();
  const { setUser, setAuthenticated, navigateTo, page } = useAppStore();
  const navigate = useNavigate();
  const ensureUser = useMutation(api.users.ensureUser);
  const userQuery = useQuery(api.users.getCurrentUser);
  const isLoading = userQuery === undefined;

  useEffect(() => {
    if (isLoading) return;

    if (userQuery) {
      const user: User = {
        id: userQuery._id,
        name: userQuery.name || userQuery.email?.split('@')[0] || 'User',
        email: userQuery.email || '',
        avatarUrl: userQuery.image || `https://i.pravatar.cc/150?u=${userQuery.email}`,
        subscription: {
          plan: (userQuery.subscriptionPlan as User['subscription']['plan']) || 'Free',
          status: (userQuery.subscriptionStatus as User['subscription']['status']) || 'active',
          nextBillingDate: userQuery.expirationDate 
            ? new Date(userQuery.expirationDate).toISOString().split('T')[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      };

      setUser(user);
      setAuthenticated(true);
    } else {
      setUser(null);
      setAuthenticated(false);
    }
  }, [isLoading, userQuery, setUser, setAuthenticated]);

  useEffect(() => {
    if (userQuery) {
      ensureUser({
        email: userQuery.email || '',
        name: userQuery.name || '',
      });

      if (page === 'signin' || page === 'signup') {
        navigate('/', { replace: true });
      }
    }
  }, [userQuery, page, navigate, ensureUser]);

  return null;
};

const PageContent: React.FC = () => {
  const { page, isModalOpen, modalImage, closeModal, navigateTo, isAuthenticated, user } = useAppStore();

  // Convex hooks
  const convexHistory = useQuery(api.redesigns.getHistory);
  const saveRedesignMutation = useMutation(api.redesigns.saveRedesign);
  const togglePinMutation = useMutation(api.redesigns.togglePin);
  const deleteRedesignMutation = useMutation(api.redesigns.deleteRedesign);
  const checkLimitQuery = useQuery(api.redesigns.checkLimit);

  // Process Convex history to match HydratedHistoryItem
  const processedHistory = processConvexHistory(convexHistory);

  // Convex action handlers
  const handlePin = async (id: string) => {
    try {
      await togglePinMutation({ redesignId: id });
    } catch (error) {
      console.error('Failed to toggle pin', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRedesignMutation({ redesignId: id });
    } catch (error) {
      console.error('Failed to delete redesign', error);
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await deleteRedesignMutation({ redesignId: id });
      }
    } catch (error) {
      console.error('Failed to delete multiple redesigns', error);
    }
  };

  const viewFromHistory = (item: any) => {
    const fullItem = {
      ...item,
      originalImage: {
        name: 'Original Image',
        type: 'image/jpeg',
        base64: '',
        url: item.originalImageUrl
      },
      redesignedImage: item.redesignedImageUrl,
      fromHistory: true
    };
    useAppStore.getState().loadItem(fullItem);
  };

  useEffect(() => {
    const baseTitle = 'AI Landscape Designer';
    let pageTitle = page.charAt(0).toUpperCase() + page.slice(1);
    if (page === 'main') pageTitle = 'Home';
    if (page === 'history') pageTitle = 'Projects';
    if (page === 'fair-use-policy') pageTitle = 'Fair Use Policy';

    document.title = `${baseTitle} | ${pageTitle}`;
  }, [page]);

  return (
    <div className="min-h-screen text-slate-800 font-sans p-2 sm:p-4 lg:p-6 xl:p-8 flex flex-col">
      <div className="w-full flex-grow mx-auto bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg ring-1 ring-black/5 flex flex-col">
        <Header />
        <main className="p-3 sm:p-4 lg:p-6 xl:p-8 flex-grow overflow-y-auto flex flex-col">
          <Routes>
            <Route path="/" element={<DesignerPage />} />
            <Route path="/history" element={isAuthenticated ? <HistoryPage historyItems={processedHistory || []} onView={viewFromHistory} onPin={handlePin} onDelete={handleDelete} onDeleteMultiple={handleDeleteMultiple} isLoading={convexHistory === undefined} /> : <Navigate to="/signin" replace />} />
            <Route path="/pricing" element={<PricingPage onNavigate={navigateTo} />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/signin" replace />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/fair-use-policy" element={<FairUsePolicyPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
      {isModalOpen && modalImage && <Modal imageUrl={modalImage} onClose={closeModal} />}
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const page = pathToPage[location.pathname] || 'main';
    useAppStore.setState({ page });
  }, [location.pathname]);

  useEffect(() => {
    useAppStore.getState().setNavigate(navigate);
  }, [navigate]);

  return (
    <ErrorBoundary>
      <AuthInitializer />
      <PageContent />
    </ErrorBoundary>
  );
};

export default App;
