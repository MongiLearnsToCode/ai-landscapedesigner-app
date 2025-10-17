import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export const SignInPage: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <SignIn 
        routing="path" 
        path="/signin"
        signUpUrl="/signup"
        afterSignInUrl="/"
      />
    </div>
  );
};