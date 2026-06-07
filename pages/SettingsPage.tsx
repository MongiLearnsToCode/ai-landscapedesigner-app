
import React, { useState } from 'react';
import { useAction } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../convex/_generated/api';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { AccountLayout } from '../components/Account/AccountLayout';
import { BillingSection } from '../components/Account/BillingSection';
import { UsageSection } from '../components/Account/UsageSection';
import { SettingsSection } from '../components/Account/SettingsSection';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAppStore();
  const { addToast } = useToastStore();
  const { signOut } = useAuthActions();
  const deleteAccount = useAction(api.polar.deleteAccount);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  if (!user) {
    return null; // Should be redirected by App.tsx logic
  }

  const handleConfirmSignOut = async () => {
    setIsSignOutModalOpen(false);
    await signOut();
    logout(); // This handles state reset and navigation
    addToast('You have been signed out.', 'info');
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      localStorage.removeItem('designerSession');
      setIsDeleteAccountModalOpen(false);
      logout();
      addToast('Your account has been deleted.', 'success');
    } catch (error) {
      console.error('Account deletion failed:', error);
      addToast('Unable to delete account. Please try again or contact support.', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const renderSection = (activeSection: string) => {
    switch (activeSection) {
      case 'billing':
        return <BillingSection />;
      case 'usage':
        return <UsageSection />;
      case 'settings':
        return (
          <SettingsSection
            onSignOut={() => setIsSignOutModalOpen(true)}
            onDeleteAccount={() => setIsDeleteAccountModalOpen(true)}
          />
        );
      default:
        return <BillingSection />;
    }
  };

  return (
    <>
      <AccountLayout>
        {(activeSection) => renderSection(activeSection)}
      </AccountLayout>
      
      <ConfirmationModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleConfirmSignOut}
        title="Confirm Sign Out"
        message="You will leave your account area and return to the home page. Your projects and account data will remain available when you sign in again."
        confirmText="Sign Out"
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => {
          if (!isDeletingAccount) setIsDeleteAccountModalOpen(false);
        }}
        onConfirm={handleConfirmDeleteAccount}
        title="Delete Account"
        message="This permanently removes your profile, login credentials, preferences, and saved projects. If you have an active paid subscription, renewal will be canceled before deletion. This cannot be undone."
        confirmText={isDeletingAccount ? 'Deleting…' : 'Delete Account'}
        cancelText="Keep Account"
        isConfirming={isDeletingAccount}
      />
    </>
  );
};
