import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useNavigate, Link } from 'react-router-dom';
import { useToastStore } from '../stores/toastStore';

export const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);
    
    try {
      // Create account with Convex Auth
      await signIn('password', { email, password, name, flow: 'signUp' });

      navigate('/');
      addToast('Account created.', 'success');
    } catch (error) {
      console.error('Sign up error:', error);
      const message = 'Unable to create this account. Try signing in, or use a different email address.';
      setFormError(message);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-orange-500 hover:text-orange-600">
              sign in
            </Link>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
	              required
	              value={email}
	              onChange={(e) => setEmail(e.target.value)}
	              spellCheck={false}
	              aria-invalid={formError ? true : undefined}
	              aria-describedby={formError ? 'signup-error' : undefined}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
	              value={password}
	              onChange={(e) => setPassword(e.target.value)}
	              minLength={8}
	              aria-invalid={formError ? true : undefined}
	              aria-describedby={formError ? 'signup-error password-help' : 'password-help'}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="••••••••"
            />
	            <p id="password-help" className="mt-1 text-xs text-slate-500">Must be at least 8 characters</p>
	          </div>

	          <div>
	            {formError && (
	              <p id="signup-error" className="mb-3 text-sm font-medium text-red-600" role="alert">
	                {formError}
	              </p>
	            )}
	            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating account…' : 'Sign up'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-xs text-slate-500 text-center">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="font-medium text-orange-500 hover:text-orange-600">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="font-medium text-orange-500 hover:text-orange-600">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
