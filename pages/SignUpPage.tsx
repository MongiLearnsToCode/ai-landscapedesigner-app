import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { useApp } from '../contexts/AppContext';

export const SignUpPage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-md">
        <SignUp 
          routing="virtual"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-lg w-full",
              footer: "hidden"
            }
          }}
        />
        <p className="text-sm text-slate-600 text-center mt-4 px-2">
          Already have an account?{' '}
          <button 
            onClick={() => navigateTo('signin')}
            className="font-medium text-orange-500 hover:text-orange-600"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};