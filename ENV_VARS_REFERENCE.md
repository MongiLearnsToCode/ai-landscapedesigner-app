# Environment Variables Reference

## Current Architecture

The app uses Convex for backend persistence/auth/server functions, Vercel/Express API routes for server-side web endpoints, and Vite for the React frontend.

## Convex Environment Variables

Set these in the Convex dashboard:

```bash
# Convex Auth
CONVEX_SITE_URL=https://your-deployment.convex.site
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL="AI Landscape Designer <noreply@ai-landscapedesigner.com>"

# Polar billing
POLAR_ACCESS_TOKEN=polar_oat_your_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
POLAR_SANDBOX=true
POLAR_PRODUCT_PERSONAL_MONTHLY=your_personal_monthly_product_id
POLAR_PRODUCT_PERSONAL_ANNUAL=your_personal_annual_product_id
POLAR_PRODUCT_CREATOR_MONTHLY=your_creator_monthly_product_id
POLAR_PRODUCT_CREATOR_ANNUAL=your_creator_annual_product_id
POLAR_PRODUCT_BUSINESS_MONTHLY=your_business_monthly_product_id
POLAR_PRODUCT_BUSINESS_ANNUAL=your_business_annual_product_id
```

Configure Polar webhooks to send subscription and order events to:

```text
https://your-deployment.convex.site/polar-webhook
```

`POLAR_WEBHOOK_SECRET` must match the webhook secret configured in Polar. `RESEND_API_KEY` is used by Convex Auth to send password reset codes. `RESEND_FROM_EMAIL` should stay on the verified `ai-landscapedesigner.com` domain unless another domain is verified in Resend.

## Vercel / Local Server Variables

Set these in Vercel project env vars and in `.env.local` for local development:

```bash
# Convex client connection
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Server-side AI and email
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1
# Local development only, if not using `gcloud auth application-default login`:
# GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL="AI Landscape Designer <noreply@ai-landscapedesigner.com>"
SUPPORT_EMAIL=support@ai-landscapedesigner.com

# Cloudinary unsigned upload config
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset
```

## Important Rules

- `VITE_*` values are bundled into browser code. Do not put secrets behind a `VITE_` prefix.
- `RESEND_API_KEY`, `POLAR_ACCESS_TOKEN`, and `POLAR_WEBHOOK_SECRET` are server-side only.
- `RESEND_FROM_EMAIL` defaults to `AI Landscape Designer <noreply@ai-landscapedesigner.com>`, and `SUPPORT_EMAIL` defaults to `support@ai-landscapedesigner.com`.
- Gemini image generation uses Vertex AI through Application Default Credentials. Enable Vertex AI API for `GOOGLE_CLOUD_PROJECT`, grant the runtime identity Vertex AI permissions, and set `GOOGLE_CLOUD_LOCATION` to a region where the selected models are available.
- The database is Convex-only. Do not add `DATABASE_URL`, Drizzle, or Neon setup back to relaunch docs unless the architecture changes.
