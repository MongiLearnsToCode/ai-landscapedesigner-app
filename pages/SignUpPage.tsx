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
    plan: 'Free',
    status: 'trialing',
    nextBillingDate: '2024-12-31',
  },
};

export const SignUpPage: React.FC = () => {
  const { navigateTo, login } = useApp();
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addToast('Account created successfully!', 'success');
    login(MOCK_USER);
    navigateTo('main');
  };

  const inputClasses = "w-full h-11 px-4 py-2 text-sm text-slate-800 bg-slate-100/80 border border-transparent rounded-lg outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="w-full max-w-md mx-auto my-auto bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200/80">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Create a new account</h2>
        <p className="mt-2 text-sm text-slate-600">
          Already have an account?{' '}
          <button onClick={() => navigateTo('signin')} className="font-medium text-orange-500 hover:text-orange-600">
            Sign in
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className={labelClasses}>Full Name</label>
          <input id="name" name="name" type="text" autoComplete="name" required className={inputClasses} placeholder="Alex Rivera"/>
        </div>
        <div>
          <label htmlFor="email" className={labelClasses}>Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClasses} placeholder="you@example.com"/>
        </div>
        <div>
          <label htmlFor="password" className={labelClasses}>Password</label>
          <input id="password" name="password" type="password" required className={inputClasses} placeholder="••••••••"/>
        </div>

        <p className="text-xs text-slate-500 text-center">
            By creating an account, you agree to our{' '}
            <button type="button" onClick={() => navigateTo('terms')} className="font-medium underline hover:text-slate-700">Terms of Service</button> and{' '}
            <button type="button" onClick={() => navigateTo('privacy')} className="font-medium underline hover:text-slate-700">Privacy Policy</button>.
        </p>

        <div>
          <button type="submit" className="w-full h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
};