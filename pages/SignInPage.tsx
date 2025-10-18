import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useApp } from '../contexts/AppContext';

export const SignInPage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
      <SignIn 
        routing="virtual"
        afterSignInUrl="/"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg"
          }
        }}
      />
      <p className="text-sm text-slate-600">
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