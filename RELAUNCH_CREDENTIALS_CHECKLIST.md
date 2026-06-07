# Relaunch Credentials Checklist

Do not paste secret values into chat. Enter them directly in CLI prompts or provider dashboards.

## 1. Resend

Used for:
- Contact form emails from API/server routes
- Convex Auth password reset emails

Steps:

1. Go to the Resend dashboard.
2. Confirm the sending domain for `ai-landscapedesigner.com` is still verified.
3. Create an API key with send permissions.
4. Add it locally in `.env.local`:

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="AI Landscape Designer <noreply@ai-landscapedesigner.com>"
SUPPORT_EMAIL=support@ai-landscapedesigner.com
```

5. Add it to Convex:

```bash
npx convex env set RESEND_API_KEY
npx convex env set RESEND_FROM_EMAIL
```

6. Add it to Vercel production:

```bash
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add SUPPORT_EMAIL production
```

Email sends from `AI Landscape Designer <noreply@ai-landscapedesigner.com>` and routes contact submissions to `support@ai-landscapedesigner.com` by default.

## 2. Cloudinary

Used for browser image uploads.

Steps:

1. In Cloudinary, get the cloud name.
2. Create an unsigned upload preset.
3. Restrict the preset where possible: image formats only, size limits, and a folder such as `ai-landscapedesigner/uploads`.
4. Add locally in `.env.local`:

```bash
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

5. Add to Vercel production:

```bash
vercel env add VITE_CLOUDINARY_CLOUD_NAME production
vercel env add VITE_CLOUDINARY_UPLOAD_PRESET production
```

These are public client values, not secrets.

## 3. Polar

Used for checkout, subscriptions, customer portal, and webhook subscription sync.

Steps:

1. In Polar, create products for:
   - Personal monthly
   - Personal annual
   - Creator monthly
   - Creator annual
   - Business monthly
   - Business annual
2. Create a server-side access token.
3. Create a webhook endpoint pointing to:

```text
https://scintillating-gerbil-404.convex.site/polar-webhook
```

4. Ensure `.env.local` uses the Convex site URL, not the cloud URL, for auth/webhook site config:

```bash
CONVEX_SITE_URL=https://scintillating-gerbil-404.convex.site
```

5. Set Polar values in Convex:

```bash
npx convex env set POLAR_ACCESS_TOKEN
npx convex env set POLAR_WEBHOOK_SECRET
npx convex env set POLAR_SANDBOX
npx convex env set POLAR_PRODUCT_PERSONAL_MONTHLY
npx convex env set POLAR_PRODUCT_PERSONAL_ANNUAL
npx convex env set POLAR_PRODUCT_CREATOR_MONTHLY
npx convex env set POLAR_PRODUCT_CREATOR_ANNUAL
npx convex env set POLAR_PRODUCT_BUSINESS_MONTHLY
npx convex env set POLAR_PRODUCT_BUSINESS_ANNUAL
```

For relaunch, use live Polar products and set:

```bash
POLAR_SANDBOX=false
```

## 4. Google Vertex AI / ADC

Local setup is already verified:
- Google Cloud project: `ai-landscapedesigner`
- Billing enabled
- Vertex AI API enabled
- Local ADC token works
- ADC quota project set to `ai-landscapedesigner`

Local `.env.local` should include:

```bash
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=ai-landscapedesigner
GOOGLE_CLOUD_LOCATION=us-central1
```

Production still needs a runtime identity. Recommended next code change:

- Add support for `GOOGLE_APPLICATION_CREDENTIALS_JSON`, so Vercel can load service account JSON from an env var without committing a key file.

Then create a Google service account with `roles/aiplatform.user` and store the JSON securely in Vercel.

## 5. Vercel Production Env Vars

Minimum production values:

```bash
VITE_CONVEX_URL=https://scintillating-gerbil-404.convex.cloud
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=ai-landscapedesigner
GOOGLE_CLOUD_LOCATION=us-central1
RESEND_API_KEY=...
RESEND_FROM_EMAIL="AI Landscape Designer <noreply@ai-landscapedesigner.com>"
SUPPORT_EMAIL=support@ai-landscapedesigner.com
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

Commands:

```bash
vercel env add VITE_CONVEX_URL production
vercel env add GOOGLE_GENAI_USE_VERTEXAI production
vercel env add GOOGLE_CLOUD_PROJECT production
vercel env add GOOGLE_CLOUD_LOCATION production
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add SUPPORT_EMAIL production
vercel env add VITE_CLOUDINARY_CLOUD_NAME production
vercel env add VITE_CLOUDINARY_UPLOAD_PRESET production
```

## Verification

After credentials are configured:

```bash
npx tsc --noEmit
npm run build
npm run test
npm audit --audit-level=moderate
```

Then run local app flow:

```bash
npm run dev
```

Manual checks:
- Sign up
- Password reset email sends
- Contact form sends
- Image upload succeeds
- AI redesign succeeds through Vertex AI
- Polar checkout redirects
- Polar webhook updates Convex subscription state
