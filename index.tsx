
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './styles.css'; // Import Tailwind CSS and custom styles
import App from './App';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || (globalThis as any).process?.env?.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing Publishable Key")
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={publishableKey}
      routing="hash"
      signInUrl="/signin"
      signUpUrl="/signup"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
