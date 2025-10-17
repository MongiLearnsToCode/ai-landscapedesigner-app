import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
  fetchOptions: {
    onError(context) {
      console.error("Auth client error:", context.error);
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
