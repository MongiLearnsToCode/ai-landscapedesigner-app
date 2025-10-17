import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

export const ResetPasswordPage: React.FC = () => {
  const { navigateTo } = useApp();
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addToast('If an account exists for this email, a reset link has been sent.', 'success');
    navigateTo('signin');
  };
  
  const inputClasses = "w-full h-11 px-4 py-2 text-sm text-slate-800 bg-slate-100/80 border border-transparent rounded-lg outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="w-full max-w-md mx-auto my-auto bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200/80">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Reset your password</h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email address and we will send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className={labelClasses}>Email address</label>
          {/* FIX: Corrected a typo in the variable name from `input-classes` to `inputClasses`. */}
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClasses} placeholder="you@example.com"/>
        </div>

        <div>
          <button type="submit" className="w-full h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
            Send Reset Link
          </button>
        </div>
         <div className="text-center">
            <button
                type="button"
                onClick={() => navigateTo('signin')}
                className="text-sm font-medium text-orange-500 hover:text-orange-600"
              >
                Back to Sign In
              </button>
        </div>
      </form>
    </div>
  );
};