
import React, { useState } from 'react';

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

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
      checked ? 'bg-orange-500' : 'bg-slate-300'
    }`}>
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const NotificationSettings: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  return (
    <SectionCard title="Account Settings">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-slate-800">Email Notifications</p>
            <p className="text-sm text-slate-500">Get important updates about your account.</p>
          </div>
          <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-slate-800">Product Updates</p>
            <p className="text-sm text-slate-500">Receive news about new features and releases.</p>
          </div>
          <Toggle checked={productUpdates} onChange={setProductUpdates} />
        </div>
      </div>
    </SectionCard>
  );
};

const DangerZone: React.FC<{ onDelete: () => void }> = ({ onDelete }) => (
  <div className="bg-white rounded-lg shadow-md mt-8">
    <div className="p-6 border-b border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">Danger Zone</h3>
    </div>
    <div className="p-6">
      <div className="bg-red-50 p-4 rounded-lg border border-red-200/80 flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-red-800">Delete Your Account</h4>
          <p className="mt-1 text-sm text-red-700">
            Once you delete your account, there is no going back. Please be certain.
          </p>
        </div>
        <button
          onClick={onDelete}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          Delete Account
        </button>
      </div>
    </div>
  </div>
);

export const SettingsSection: React.FC<{ onDelete: () => void }> = ({ onDelete }) => {
  return (
    <div>
      <NotificationSettings />
      <DangerZone onDelete={onDelete} />
    </div>
  );
};
