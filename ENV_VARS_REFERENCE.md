# Environment Variables Reference

## Overview

Your app uses two separate environments:
- **Convex** (Backend) - Handles webhooks, database, and server-side logic
- **Vercel** (Frontend) - Serves the React app and handles client-side logic

## ✅ Current Configuration (Correct)

### Convex Environment Variables

Set these in **Convex Dashboard** (`https://dashboard.convex.dev/`):

```bash
# Polar Webhook & API (Required for webhooks)
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
POLAR_ACCESS_TOKEN=polar_sandbox_xxxxxxxxxxxxx
POLAR_SANDBOX=true

# Clerk Authentication (Required for auth)
CLERK_JWT_ISSUER_DOMAIN=your-clerk-domain.clerk.accounts.dev
```

**Used by:**
- `convex/polar.ts` - Webhook signature verification
- `convex/users.ts` - Polar API calls (customer portal)
- `convex/auth.config.ts` - Clerk JWT verification

**How to set:**
1. Go to Convex Dashboard
2. Select project: `scintillating-gerbil-404`
3. Settings → Environment Variables
4. Add each variable
5. Run `npx convex deploy` to apply

---

### Vercel Environment Variables

Set these in **Vercel Dashboard** or `.env.local` for development:

```bash
# Convex Connection (Required)
VITE_CONVEX_URL=https://scintillating-gerbil-404.convex.cloud

# Clerk Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Polar Frontend (Required for checkout)
VITE_POLAR_ACCESS_TOKEN=polar_sandbox_xxxxxxxxxxxxx
VITE_POLAR_SANDBOX=true

# Polar Product IDs (Required for pricing page)
VITE_POLAR_PRODUCT_PERSONAL_MONTHLY=prod_xxxxxxxxxxxxx
VITE_POLAR_PRODUCT_PERSONAL_ANNUAL=prod_xxxxxxxxxxxxx
VITE_POLAR_PRODUCT_CREATOR_MONTHLY=prod_xxxxxxxxxxxxx
VITE_POLAR_PRODUCT_CREATOR_ANNUAL=prod_xxxxxxxxxxxxx
VITE_POLAR_PRODUCT_BUSINESS_MONTHLY=prod_xxxxxxxxxxxxx
VITE_POLAR_PRODUCT_BUSINESS_ANNUAL=prod_xxxxxxxxxxxxx

# Gemini AI (Required for image generation)
VITE_GEMINI_API_KEY=xxxxxxxxxxxxx

# Cloudinary (Required for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=xxxxxxxxxxxxx
VITE_CLOUDINARY_UPLOAD_PRESET=xxxxxxxxxxxxx
```

**Used by:**
- `index.tsx` - Convex and Clerk initialization
- `pages/PricingPage.tsx` - Product IDs for checkout
- `services/polarService.ts` - Frontend Polar integration
- `services/geminiService.ts` - AI image generation
- `services/cloudinaryService.ts` - Image uploads

**How to set:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable for Production, Preview, and Development
3. Redeploy your app

---

## 📋 Quick Reference Table

| Variable | Convex | Vercel | Purpose |
|----------|--------|--------|---------|
| **Polar Backend** | | | |
| `POLAR_WEBHOOK_SECRET` | ✅ | ❌ | Verify webhook signatures |
| `POLAR_ACCESS_TOKEN` | ✅ | ❌ | Server-side Polar API calls |
| `POLAR_SANDBOX` | ✅ | ❌ | Backend environment mode |
| **Polar Frontend** | | | |
| `VITE_POLAR_ACCESS_TOKEN` | ❌ | ✅ | Client-side checkout creation |
| `VITE_POLAR_SANDBOX` | ❌ | ✅ | Frontend environment mode |
| `VITE_POLAR_PRODUCT_PERSONAL_MONTHLY` | ❌ | ✅ | Personal plan monthly product ID |
| `VITE_POLAR_PRODUCT_PERSONAL_ANNUAL` | ❌ | ✅ | Personal plan annual product ID |
| `VITE_POLAR_PRODUCT_CREATOR_MONTHLY` | ❌ | ✅ | Creator plan monthly product ID |
| `VITE_POLAR_PRODUCT_CREATOR_ANNUAL` | ❌ | ✅ | Creator plan annual product ID |
| `VITE_POLAR_PRODUCT_BUSINESS_MONTHLY` | ❌ | ✅ | Business plan monthly product ID |
| `VITE_POLAR_PRODUCT_BUSINESS_ANNUAL` | ❌ | ✅ | Business plan annual product ID |
| **Authentication** | | | |
| `CLERK_JWT_ISSUER_DOMAIN` | ✅ | ❌ | Verify JWT tokens in Convex |
| `VITE_CLERK_PUBLISHABLE_KEY` | ❌ | ✅ | Initialize Clerk in frontend |
| **Convex** | | | |
| `VITE_CONVEX_URL` | ❌ | ✅ | Connect frontend to Convex |
| **Other Services** | | | |
| `VITE_GEMINI_API_KEY` | ❌ | ✅ | AI image generation |
| `VITE_CLOUDINARY_CLOUD_NAME` | ❌ | ✅ | Image upload service |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | ❌ | ✅ | Image upload config |

---

## 🔍 How to Verify

### Check Convex Variables
```bash
npx convex env list
```

Should show:
- `POLAR_WEBHOOK_SECRET`
- `POLAR_ACCESS_TOKEN`
- `POLAR_SANDBOX`
- `CLERK_JWT_ISSUER_DOMAIN`

### Check Vercel Variables
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Verify all `VITE_*` variables are set

### Check Local Development
Look at `.env.local` (gitignored):
```bash
cat .env.local
```

Should contain all `VITE_*` variables for local development.

---

## 🚨 Common Mistakes

### ❌ Wrong: Putting VITE_ variables in Convex
```bash
# DON'T DO THIS in Convex
VITE_POLAR_PRODUCT_PERSONAL_MONTHLY=prod_xxx  # ❌ Wrong place
```

### ❌ Wrong: Putting backend secrets in Vercel
```bash
# DON'T DO THIS in Vercel
POLAR_WEBHOOK_SECRET=whsec_xxx  # ❌ Won't work, needs to be in Convex
```

### ✅ Correct: Separate environments
```bash
# Convex (Backend)
POLAR_WEBHOOK_SECRET=whsec_xxx  # ✅ Correct

# Vercel (Frontend)
VITE_POLAR_PRODUCT_PERSONAL_MONTHLY=prod_xxx  # ✅ Correct
```

---

## 📝 Why the Separation?

### VITE_ Prefix
- Variables with `VITE_` prefix are **bundled into your frontend code**
- Accessible in browser via `import.meta.env.VITE_*`
- Safe to expose (public keys, product IDs, etc.)
- Deployed with Vercel

### No Prefix (Convex)
- Variables without prefix are **server-side only**
- Accessible in Convex via `process.env.*`
- Never exposed to browser (secrets, webhook keys)
- Deployed with Convex

---

## 🔄 After Changing Variables

### Convex Variables Changed
```bash
npx convex deploy
```

### Vercel Variables Changed
1. Update in Vercel Dashboard
2. Trigger a new deployment (or wait for next commit)

### Local Development Variables Changed
1. Update `.env.local`
2. Restart dev server: `npm run dev`

---

## 📚 See Also

- `.env.example` - Template with all required variables
- `POLAR_WEBHOOK_FIX.md` - Webhook configuration guide
- `DEPLOYMENT_SUCCESS.md` - Deployment verification
