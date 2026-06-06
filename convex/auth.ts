import { Email } from "@convex-dev/auth/providers/Email";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      reset: Email({
        id: "password-reset",
        from: "AI Landscape Designer <noreply@ai-landscapedesigner.com>",
        async sendVerificationRequest({ identifier, token }) {
          const apiKey = process.env.RESEND_API_KEY;
          if (!apiKey) {
            throw new Error("RESEND_API_KEY is not configured");
          }

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "AI Landscape Designer <noreply@ai-landscapedesigner.com>",
              to: [identifier],
              subject: "Reset your AI Landscape Designer password",
              html: `<p>Use this code to reset your password:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;">${token}</p><p>This code expires in one hour.</p>`,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to send password reset email");
          }
        },
      }),
    }),
  ],
});
