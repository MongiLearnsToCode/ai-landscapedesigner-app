
import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { AccountLayout } from '../components/Account/AccountLayout';
import { ProfileSection } from '../components/Account/ProfileSection';
import { BillingSection } from '../components/Account/BillingSection';
import { UsageSection } from '../components/Account/UsageSection';
import { SettingsSection } from '../components/Account/SettingsSection';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAppStore();
  const { addToast } = useToastStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!user) {
    return null; // Should be redirected by App.tsx logic
  }

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    logout(); // This handles state reset and navigation
    addToast('Your account has been successfully deleted.', 'info');
  };

  const renderSection = (activeSection: string) => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'billing':
        return <BillingSection />;
      case 'usage':
        return <UsageSection />;
      case 'settings':
        return <SettingsSection onDelete={() => setIsDeleteModalOpen(true)} />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <>
      <AccountLayout>
        {(activeSection) => renderSection(activeSection)}
      </AccountLayout>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Account Deletion"
        message="Are you absolutely sure you want to delete your account? All of your projects and personal data will be permanently removed. This action cannot be undone."
        confirmText="Yes, Delete My Account"
        cancelText="Cancel"
      />
    </>
  );
};
