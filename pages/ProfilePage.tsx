import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { User, DollarSign, LogOut, AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

// --- Reusable Components for the Profile Page ---

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80">
    <div className="p-6 border-b border-slate-200/80">
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="text-base text-slate-800">{value}</p>
  </div>
);

// --- Page-specific sections ---

const ClerkProfilePlaceholder: React.FC = () => {
  const { user } = useApp();
  if (!user) return null;

  return (
    <Section title="Profile & Security">
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
        <h4 className="font-bold text-slate-800">Coming Soon: Integrated Profile Management</h4>
        <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
          User profile information (name, email, avatar) and security settings (password changes) will be managed here using Clerk. For now, your basic information is displayed below.
        </p>
      </div>
      <div className="mt-6 flex items-center gap-6">
        <img src={user.avatarUrl} alt="User avatar" className="h-20 w-20 rounded-full ring-4 ring-white shadow-md" />
        <div className="space-y-4">
          <InfoRow label="Full Name" value={user.name} />
          <InfoRow label="Email Address" value={user.email} />
        </div>
      </div>
    </Section>
  );
};

const SubscriptionContent: React.FC = () => {
  const { user, navigateTo } = useApp();
  const { addToast } = useToast();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  if (!user) return null;

  const handleConfirmCancel = () => {
    addToast('Your subscription has been canceled.', 'info');
    setIsCancelModalOpen(false);
    // API call to cancel subscription would go here.
  };

  return (
    <>
      <Section title="My Subscription">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-base font-semibold text-slate-800">{user.subscription.plan} Plan</p>
              <p className="text-sm text-slate-500">Next billing date: {new Date(user.subscription.nextBillingDate).toLocaleDateString()}</p>
            </div>
            <span className="mt-2 sm:mt-0 capitalize text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">{user.subscription.status}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
            <button onClick={() => setIsCancelModalOpen(true)} className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Cancel Subscription</button>
            <button onClick={() => navigateTo('pricing')} className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors">Change Plan</button>
          </div>
        </div>
      </Section>
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period."
        confirmText="Yes, Cancel"
        cancelText="Nevermind"
      />
    </>
  );
};

const AccountContent: React.FC<{ onDelete: () => void }> = ({ onDelete }) => {
  return (
    <Section title="Danger Zone">
      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
        <h4 className="font-bold text-red-800">Delete Your Account</h4>
        <p className="mt-1 text-sm text-red-700">
          Once you delete your account, there is no going back. All of your data, including your projects and personal information, will be permanently removed. Please be certain before you proceed.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete My Account
          </button>
        </div>
      </div>
    </Section>
  );
};

// --- Main Profile Page Component ---

export const ProfilePage: React.FC = () => {
  const { user, logout } = useApp();
  const { addToast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!user) {
    return null; // Should be redirected by App.tsx logic
  }

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    logout(); // This handles state reset and navigation
    addToast('Your account has been successfully deleted.', 'info');
  };

  return (
    <>
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800">Account Settings</h2>
            <p className="text-slate-500 mt-1">Manage your profile, subscription, and account settings.</p>
        </div>
        
        <ClerkProfilePlaceholder />
        
        <SubscriptionContent />
        
        <AccountContent onDelete={() => setIsDeleteModalOpen(true)} />
        
        <div className="pt-4 text-center border-t border-slate-200/80">
            <button
                onClick={logout}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition-colors flex items-center mx-auto"
            >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
            </button>
        </div>
      </div>
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