import { createAuthClient } from "better-auth/react";

const baseURL = import.meta.env.PROD 
  ? "https://www.ai-landscapedesigner.com/api/auth" 
  : "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    onError(context) {
      console.error("Auth client error:", context.error);
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
