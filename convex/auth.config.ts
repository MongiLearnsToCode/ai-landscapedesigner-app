import { AuthConfig } from "convex/server";

if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  throw new Error('CLERK_JWT_ISSUER_DOMAIN is required');
}

const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN as string;

export default {
  providers: [
    {
      domain: issuer,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;