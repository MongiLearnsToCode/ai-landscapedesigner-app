import { AuthConfig } from "convex/server";

if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  throw new Error('CLERK_JWT_ISSUER_DOMAIN is required');
}

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;