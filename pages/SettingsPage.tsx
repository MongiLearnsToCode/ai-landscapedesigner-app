
import React, { useState } from 'react';
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
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  if (!user) {
    return null; // Should be redirected by App.tsx logic
  }

  const handleConfirmSignOut = () => {
    setIsSignOutModalOpen(false);
    logout(); // This handles state reset and navigation
    addToast('You have been signed out.', 'info');
  };

  const renderSection = (activeSection: string) => {
    switch (activeSection) {
      case 'billing':
        return <BillingSection />;
      case 'usage':
        return <UsageSection />;
      case 'settings':
        return <SettingsSection onSignOut={() => setIsSignOutModalOpen(true)} />;
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
    </>
  );
};
