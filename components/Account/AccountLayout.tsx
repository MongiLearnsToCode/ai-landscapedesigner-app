
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, BarChart2, LogOut, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

const navItems = [
  { id: 'settings', label: 'Profile & Customizations', icon: SlidersHorizontal },
  { id: 'billing', label: 'Subscription & Billing', icon: CreditCard },
  { id: 'usage', label: 'Usage', icon: BarChart2 },
];

interface AccountLayoutProps {
  children: (activeSection: string) => React.ReactNode;
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get('section') || 'settings';
  const initialSection = navItems.some((item) => item.id === requestedSection) ? requestedSection : 'settings';
  const [activeSection, setActiveSection] = useState(initialSection);
  const { logout } = useAppStore();

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setSearchParams(sectionId === 'settings' ? {} : { section: sectionId });
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">App Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your profile, preferences, subscription, and usage.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <nav className="space-y-1">
              {navItems.map((item) => (
	                <button
	                  key={item.id}
	                  onClick={() => handleSectionChange(item.id)}
	                  className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
	                    activeSection === item.id
	                      ? 'bg-orange-100 text-orange-600'
	                      : 'text-slate-600 hover:bg-slate-100'
	                  }`}
	                  aria-current={activeSection === item.id ? 'page' : undefined}
	                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                onClick={logout}
                className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span>Logout</span>
              </button>
            </nav>
          </aside>

          <main className="md:col-span-3">
            {children(activeSection)}
          </main>
        </div>
      </div>
    </div>
  );
};
