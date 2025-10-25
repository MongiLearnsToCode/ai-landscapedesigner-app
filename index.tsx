
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import './styles.css'; // Import Tailwind CSS and custom styles
import App from './App';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!publishableKey) {
  throw new Error("Missing Clerk Publishable Key")
}

if (!convexUrl) {
  throw new Error("Missing Convex URL")
}

const convex = new ConvexReactClient(convexUrl);

function ConvexClerkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider
        publishableKey={publishableKey}
        routing="path"
        signInUrl="/signin"
        signUpUrl="/signup"
      >
        <ConvexClerkWrapper>
          <App />
        </ConvexClerkWrapper>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);
