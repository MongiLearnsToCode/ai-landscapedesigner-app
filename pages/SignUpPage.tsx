import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { useApp } from '../contexts/AppContext';

export const SignUpPage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] px-2 sm:px-4 lg:px-6 py-6 sm:py-8">
      <div className="w-full max-w-sm sm:max-w-md">
        <SignUp 
          routing="virtual"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-lg w-full p-4 sm:p-6 mx-auto",
              headerTitle: "text-lg sm:text-xl font-semibold",
              headerSubtitle: "text-sm sm:text-base",
              socialButtonsBlockButton: "w-full h-10 sm:h-12 text-sm sm:text-base mb-2",
              formFieldInput: "w-full h-10 sm:h-12 text-sm sm:text-base px-3 sm:px-4",
              formButtonPrimary: "w-full h-10 sm:h-12 text-sm sm:text-base font-semibold",
              formFieldLabel: "text-sm sm:text-base font-medium",
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