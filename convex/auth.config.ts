import { convexAuth } from "@convex-dev/auth/server";
import { clerk } from "@convex-dev/auth/providers/clerk";

const customAuth = convexAuth({
  providers: [
    clerk({
      issuer: process.env.CLERK_JWT_ISSUER_DOMAIN,
    }),
  ],
});

export default customAuth;