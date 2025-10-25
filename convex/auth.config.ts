import { convexAuth } from "@convex-dev/auth/server";
import { clerk } from "@convex-dev/auth/providers/clerk";

if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  throw new Error('CLERK_JWT_ISSUER_DOMAIN is required');
}

const customAuth = convexAuth({
  providers: [
    clerk({
      issuer: process.env.CLERK_JWT_ISSUER_DOMAIN,
    }),
  ],
});

export default customAuth;