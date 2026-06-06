import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';

export const ResetPasswordPage: React.FC = () => {
  const { signIn } = useAuthActions();
  const { navigateTo } = useAppStore();
  const { addToast } = useToastStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn('password', { email, flow: 'reset' });
      setStep('verify');
      addToast('If an account exists for this email, a reset code has been sent.', 'success');
    } catch (error) {
      console.error('Password reset request failed:', error);
      addToast('Unable to start password reset. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn('password', {
        email,
        code,
        newPassword,
        flow: 'reset-verification',
      });
      addToast('Password reset successfully. You are now signed in.', 'success');
      navigateTo('main');
    } catch (error) {
      console.error('Password reset verification failed:', error);
      addToast('Invalid reset code or password. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full h-11 px-4 py-2 text-sm text-slate-800 bg-slate-100/80 border border-transparent rounded-lg outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="w-full max-w-md mx-auto my-auto bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200/80">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Reset your password</h2>
        <p className="mt-2 text-sm text-slate-600">
          {step === 'request'
            ? 'Enter your email address and we will send you a reset code.'
            : 'Enter the reset code and choose a new password.'}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={requestReset} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className={labelClasses}>Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClasses}
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyReset} className="mt-8 space-y-6">
          <div>
            <label htmlFor="code" className={labelClasses}>Reset code</label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={inputClasses}
              placeholder="Enter code"
            />
          </div>

          <div>
            <label htmlFor="new-password" className={labelClasses}>New password</label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={inputClasses}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => navigateTo('signin')}
          className="text-sm font-medium text-orange-500 hover:text-orange-600"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
};
