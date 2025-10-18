import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useApp } from '../contexts/AppContext';

export const SignInPage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] px-2 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-md">
        <SignIn 
          routing="virtual"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-lg",
              footer: "hidden"
            }
          }}
        />
        <p className="text-sm text-slate-600 text-center mt-4 px-2">
          Don't have an account?{' '}
          <button 
            onClick={() => navigateTo('signup')}
            className="font-medium text-orange-500 hover:text-orange-600"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};