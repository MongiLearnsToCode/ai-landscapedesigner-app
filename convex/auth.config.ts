import { convexAuth } from "@convex-dev/auth/server";

const customAuth = convexAuth({
  providers: [
    // Clerk will be configured via JWT tokens
  ],
});

export default customAuth;