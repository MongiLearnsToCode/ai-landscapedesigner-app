import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Camera, Save, Trash2, Upload, X } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { LANDSCAPING_STYLES } from '../../constants';
import type { LandscapingStyle, RedesignDensity } from '../../types';
import { useToastStore } from '../../stores/toastStore';
import { uploadImage } from '../../services/api';

const AVATAR_MAX_FILE_SIZE_MB = 5;
const AVATAR_MAX_FILE_SIZE_BYTES = AVATAR_MAX_FILE_SIZE_MB * 1024 * 1024;

const DENSITY_OPTIONS: { id: RedesignDensity; name: string }[] = [
  { id: 'minimal', name: 'Minimal' },
  { id: 'default', name: 'Balanced' },
  { id: 'lush', name: 'Lush' },
];

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

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
      checked ? 'bg-orange-500' : 'bg-slate-300'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const SaveButton: React.FC<{ isSaving: boolean; children: React.ReactNode }> = ({ isSaving, children }) => (
  <button
    type="submit"
    disabled={isSaving}
    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
  >
    <Save className="h-4 w-4" />
    {isSaving ? 'Saving…' : children}
  </button>
);

const ProfileSettings: React.FC = () => {
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const { addToast } = useToastStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const fallbackAvatar = `https://i.pravatar.cc/150?u=${user?.email || 'user'}`;
  const avatarSrc = avatarPreview || image || fallbackAvatar;
  const hasCustomAvatar = Boolean(avatarPreview || image);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setImage(user.image || '');
    setAvatarFile(null);
    setAvatarPreview('');
  }, [user]);

  const showAvatarError = (message: string) => {
    setStatusType('error');
    setStatusMessage(message);
    addToast(message, 'error');
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAvatarError('Choose a PNG, JPG, or WEBP image.');
      event.target.value = '';
      return;
    }

    if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
      showAvatarError(`Choose an image smaller than ${AVATAR_MAX_FILE_SIZE_MB}MB.`);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarFile(file);
      setAvatarPreview(typeof reader.result === 'string' ? reader.result : '');
      setStatusMessage('');
    };
    reader.onerror = () => {
      showAvatarError('Could not preview that image. Try another file.');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setImage('');
    setStatusMessage('');
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage('');
    const trimmedName = name.trim();

    if (!trimmedName) {
      const message = 'Enter a display name before saving.';
      setStatusType('error');
      setStatusMessage(message);
      addToast(message, 'error');
      return;
    }

    setIsSaving(true);
    try {
      let profileImage = image.trim() || undefined;

      if (avatarFile) {
        const uploadResult = await uploadImage(avatarFile);
        profileImage = uploadResult.storagePath;
      }

      await updateProfile({
        name: trimmedName,
        image: profileImage,
      });
      setName(trimmedName);
      setImage(profileImage || '');
      setAvatarFile(null);
      setAvatarPreview('');
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
      const message = 'Profile updated.';
      setStatusType('success');
      setStatusMessage(message);
      addToast(message, 'success');
    } catch (error) {
      console.error('Profile update failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to update profile.';
      setStatusType('error');
      setStatusMessage(message);
      addToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionCard title="Profile">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (statusType === 'error') {
                    setStatusMessage('');
                  }
                }}
                maxLength={80}
                placeholder="Your name"
                className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                aria-invalid={statusType === 'error' && statusMessage ? true : undefined}
                aria-describedby={statusMessage ? 'profile-status' : undefined}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Email</p>
              <p className="mt-1 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <div className="relative h-20 w-20 shrink-0">
              <img
                src={avatarSrc}
                alt={name ? `${name} profile photo` : 'Profile photo'}
                className="h-20 w-20 rounded-full border border-slate-200 bg-white object-cover"
              />
              <span className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-800 text-white shadow-sm">
                <Camera className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Profile Photo</p>
                <p id="profile-avatar-help" className="mt-1 text-xs leading-5 text-slate-500">
                  PNG, JPG, or WEBP up to {AVATAR_MAX_FILE_SIZE_MB}MB.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload
                </button>
                {hasCustomAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              id="profile-avatar-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleAvatarFileChange}
              aria-describedby="profile-avatar-help"
            />
          </div>
        </div>
        {statusMessage && (
          <p id="profile-status" className={`text-sm font-medium ${statusType === 'error' ? 'text-red-600' : 'text-green-700'}`} role={statusType === 'error' ? 'alert' : 'status'}>
            {statusMessage}
          </p>
        )}
        <div className="flex justify-end border-t border-slate-200 pt-5">
          <SaveButton isSaving={isSaving}>Save Profile</SaveButton>
        </div>
      </form>
    </SectionCard>
  );
};

const PreferenceSettings: React.FC = () => {
  const user = useQuery(api.users.getCurrentUser);
  const updatePreferences = useMutation(api.users.updatePreferences);
  const { addToast } = useToastStore();
  const defaultStyle = LANDSCAPING_STYLES[0].id;

  const userStyles = useMemo(() => {
    const savedStyles = Array.isArray(user?.defaultStyles) ? user.defaultStyles : [];
    const validStyles = savedStyles.filter((style): style is LandscapingStyle => (
      LANDSCAPING_STYLES.some((option) => option.id === style)
    ));
    return validStyles.length > 0 ? validStyles.slice(0, 2) : [defaultStyle];
  }, [defaultStyle, user?.defaultStyles]);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [defaultClimateZone, setDefaultClimateZone] = useState('');
  const [defaultStyles, setDefaultStyles] = useState<LandscapingStyle[]>([defaultStyle]);
  const [defaultRedesignDensity, setDefaultRedesignDensity] = useState<RedesignDensity>('default');
  const [defaultAllowStructuralChanges, setDefaultAllowStructuralChanges] = useState(false);
  const [defaultLockAspectRatio, setDefaultLockAspectRatio] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!user) return;
    setEmailNotifications(user.emailNotifications ?? true);
    setProductUpdates(user.productUpdates ?? false);
    setDefaultClimateZone(user.defaultClimateZone || '');
    setDefaultStyles(userStyles);
    setDefaultRedesignDensity((user.defaultRedesignDensity as RedesignDensity) || 'default');
    setDefaultAllowStructuralChanges(user.defaultAllowStructuralChanges ?? false);
    setDefaultLockAspectRatio(user.defaultLockAspectRatio ?? true);
  }, [user, userStyles]);

  const toggleStyle = (style: LandscapingStyle) => {
    setDefaultStyles((currentStyles) => {
      if (currentStyles.includes(style)) {
        return currentStyles.length === 1 ? currentStyles : currentStyles.filter((item) => item !== style);
      }
      return currentStyles.length >= 2 ? currentStyles : [...currentStyles, style];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage('');
    setIsSaving(true);
    try {
      await updatePreferences({
        emailNotifications,
        productUpdates,
        defaultClimateZone: defaultClimateZone.trim() || undefined,
        defaultStyles,
        defaultRedesignDensity,
        defaultAllowStructuralChanges,
        defaultLockAspectRatio,
      });
      localStorage.removeItem('designerSession');
      const message = 'Preferences updated.';
      setStatusType('success');
      setStatusMessage(message);
      addToast(message, 'success');
    } catch (error) {
      console.error('Preferences update failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to update preferences.';
      setStatusType('error');
      setStatusMessage(message);
      addToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionCard title="Customizations">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-800">Email Notifications</p>
              <p className="text-sm text-slate-500">Account, billing, and important service messages.</p>
            </div>
            <Toggle checked={emailNotifications} onChange={setEmailNotifications} label="Email notifications" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-800">Product Updates</p>
              <p className="text-sm text-slate-500">Feature announcements and product news.</p>
            </div>
            <Toggle checked={productUpdates} onChange={setProductUpdates} label="Product updates" />
          </div>
        </div>

        <div>
          <label htmlFor="default-climate-zone" className="block text-sm font-medium text-slate-700 mb-1.5">
            Default Location or Climate Zone
          </label>
          <input
            id="default-climate-zone"
            type="text"
            value={defaultClimateZone}
            onChange={(event) => setDefaultClimateZone(event.target.value)}
            maxLength={120}
            placeholder="e.g., Coastal Southern California"
            className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-slate-700 mb-2">Default Styles</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANDSCAPING_STYLES.map((style) => {
              const selected = defaultStyles.includes(style.id);
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => toggleStyle(style.id)}
                  className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 ${
                    selected
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-100/80 text-slate-700 border-slate-200/80 hover:bg-slate-200'
                  }`}
                  aria-pressed={selected}
                >
                  {style.name}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-center text-slate-400 mt-3">Select up to 2 styles.</p>
        </div>

        <div>
          <p className="block text-sm font-medium text-slate-700 mb-2">Default Density</p>
          <div className="grid grid-cols-3 gap-2">
            {DENSITY_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDefaultRedesignDensity(option.id)}
                className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 ${
                  defaultRedesignDensity === option.id
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-100/80 text-slate-700 border-slate-200/80 hover:bg-slate-200'
                }`}
                aria-pressed={defaultRedesignDensity === option.id}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={defaultAllowStructuralChanges}
              onChange={(event) => setDefaultAllowStructuralChanges(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-700"
            />
            <span className="ml-3 text-sm text-slate-700">Allow structural changes by default</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={defaultLockAspectRatio}
              onChange={(event) => setDefaultLockAspectRatio(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-700"
            />
            <span className="ml-3 text-sm text-slate-700">Lock aspect ratio by default</span>
          </label>
        </div>

	        {statusMessage && (
	          <p className={`text-sm font-medium ${statusType === 'error' ? 'text-red-600' : 'text-green-700'}`} role={statusType === 'error' ? 'alert' : 'status'}>
	            {statusMessage}
	          </p>
	        )}
	        <SaveButton isSaving={isSaving}>Save Preferences</SaveButton>
      </form>
    </SectionCard>
  );
};

const AccountAccess: React.FC<{ onSignOut: () => void; onDeleteAccount: () => void }> = ({ onSignOut, onDeleteAccount }) => (
  <div className="bg-white rounded-lg shadow-md mt-8">
    <div className="p-6 border-b border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">Account Access</h3>
    </div>
    <div className="p-6 space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h4 className="font-semibold text-slate-800">Sign Out</h4>
          <p className="mt-1 text-sm text-slate-600">
            End this session without changing your projects, profile, or subscription.
          </p>
        </div>
        <button
          onClick={onSignOut}
          className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors whitespace-nowrap"
        >
          Sign Out
        </button>
      </div>
      <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h4 className="font-semibold text-red-900">Delete Account</h4>
          <p className="mt-1 text-sm text-red-700">
            Permanently remove your profile, login credentials, preferences, and saved projects. Active paid subscription renewal will be canceled first.
          </p>
        </div>
        <button
          onClick={onDeleteAccount}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete Account
        </button>
      </div>
    </div>
  </div>
);

export const SettingsSection: React.FC<{ onSignOut: () => void; onDeleteAccount: () => void }> = ({ onSignOut, onDeleteAccount }) => {
  return (
    <div className="space-y-8">
      <ProfileSettings />
      <PreferenceSettings />
      <AccountAccess onSignOut={onSignOut} onDeleteAccount={onDeleteAccount} />
    </div>
  );
};
