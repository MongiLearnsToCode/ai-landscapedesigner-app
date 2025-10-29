
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAppStore } from '../../stores/appStore';
import { useToastStore } from '../../stores/toastStore';

const SectionCard: React.FC<{ title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, children, footer }) => (
  <div className="bg-white rounded-lg shadow-md">
    <div className="p-6 border-b border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
    {footer && (
      <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-lg">
        {footer}
      </div>
    )}
  </div>
);

export const ProfileSection: React.FC = () => {
  const { user: clerkUser } = useUser();
  const { addToast } = useToastStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (clerkUser) {
      setFullName(clerkUser.fullName || '');
      setEmail(clerkUser.primaryEmailAddress?.emailAddress || '');
    }
  }, [clerkUser]);

  const handleSaveChanges = async () => {
    if (!clerkUser) return;

    setIsSaving(true);
    try {
      await clerkUser.update({
        fullName: fullName,
      });
      // Note: Email updates often require verification and are more complex.
      // For now, we focus on updating the full name.
      addToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!clerkUser) {
    return (
      <SectionCard title="Profile Information">
        <p className="text-slate-500">Loading profile...</p>
      </SectionCard>
    );
  }

  const footer = (
    <div className="flex justify-end gap-4">
      <button className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
        Change Password
      </button>
      <button 
        onClick={handleSaveChanges}
        disabled={isSaving}
        className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  return (
    <SectionCard title="Profile Information" footer={footer}>
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <img
            src={clerkUser.imageUrl}
            alt="User avatar"
            className="h-24 w-24 rounded-full ring-4 ring-white shadow-lg"
          />
          <div>
            <button className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors">
              Upload new picture
            </button>
            <p className="mt-2 text-xs text-slate-500">At least 800x800px recommended. JPG or PNG.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
            <input 
              type="text" 
              id="fullName" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              disabled
              className="w-full px-3 py-2 text-slate-500 bg-slate-100 border border-slate-300 rounded-lg cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
