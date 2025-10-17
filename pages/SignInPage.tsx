import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { signIn } from '../lib/auth-client';

export const SignInPage: React.FC = () => {
  const { navigateTo } = useApp();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        addToast(result.error.message || 'Sign in failed', 'error');
      } else {
        addToast('Signed in successfully!', 'success');
        navigateTo('main');
      }
    } catch (error) {
      addToast('An error occurred during sign in', 'error');
    } finally {
      setIsLoading(false);
    }
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
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClasses} placeholder="you@example.com" />
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
          <input id="password" name="password" type="password" required className={inputClasses} placeholder="••••••••" />
        </div>

        <div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
};