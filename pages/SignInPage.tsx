import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import type { User } from '../types';

// Mock user data for frontend-only demonstration
const MOCK_USER: User = {
  id: 'user123',
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=user123',
  subscription: {
    plan: 'Creator',
    status: 'active',
    nextBillingDate: '2024-12-31',
  },
};

export const SignInPage: React.FC = () => {
  const { navigateTo, login } = useApp();
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addToast('Signed in successfully!', 'success');
    login(MOCK_USER);
    navigateTo('main');
  };

  const inputClasses = "w-full h-11 px-4 py-2 text-sm text-slate-800 bg-slate-100/80 border border-transparent rounded-lg outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="w-full max-w-md mx-auto my-auto bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200/80">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-slate-600">
          Or{' '}
          <button onClick={() => navigateTo('signup')} className="font-medium text-orange-500 hover:text-orange-600">
            create an account
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className={labelClasses}>Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClasses} placeholder="you@example.com" defaultValue="alex.rivera@example.com"/>
        </div>

        <div>
           <div className="flex justify-between items-center">
             <label htmlFor="password" className={labelClasses}>Password</label>
             <button
                type="button"
                onClick={() => navigateTo('reset-password')}
                className="text-xs font-medium text-orange-500 hover:text-orange-600"
              >
                Forgot your password?
              </button>
           </div>
          <input id="password" name="password" type="password" required className={inputClasses} placeholder="••••••••" defaultValue="password123"/>
        </div>

        <div>
          <button type="submit" className="w-full h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
};