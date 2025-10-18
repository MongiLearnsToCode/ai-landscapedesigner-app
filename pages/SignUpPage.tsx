import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { useApp } from '../contexts/AppContext';

export const SignUpPage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
      <SignUp 
        routing="virtual"
        fallbackRedirectUrl="/"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
            footer: "hidden"
          }
        }}
      />
      <p className="text-sm text-slate-600">
        Already have an account?{' '}
        <button 
          onClick={() => navigateTo('signin')}
          className="font-medium text-orange-500 hover:text-orange-600"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};