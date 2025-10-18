import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useApp } from '../contexts/AppContext';

export const SignInPage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="w-full max-w-md flex justify-center">
        <SignIn 
          routing="hash"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: "w-full flex justify-center",
              card: "shadow-lg w-full mx-auto",
              footer: "hidden"
            }
          }}
        />
      </div>
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
  );
};