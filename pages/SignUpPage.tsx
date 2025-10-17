import React from 'react';
import { SignUp } from '@clerk/clerk-react';

export const SignUpPage: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <SignUp 
        routing="path" 
        path="/signup"
        signInUrl="/signin"
        afterSignUpUrl="/"
      />
    </div>
  );
};