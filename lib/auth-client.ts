import { createAuthClient } from "better-auth/react";

const baseURL = import.meta.env.VITE_AUTH_URL || "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    onError(context) {
      console.error("Auth client error:", context.error);
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
