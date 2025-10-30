# 🚨 URGENT: Deploy Convex to Fix 404 Errors

## Current Status
✅ Webhook URL updated in Polar  
❌ **Convex HTTP routes NOT deployed to production**  
❌ Getting 404 errors on all webhooks

## The Problem
The `/webhooks/polar` endpoint exists in your code but **hasn't been deployed** to your production Convex instance (`scintillating-gerbil-404.convex.cloud`).

## The Solution

### Deploy to Convex Production

```bash
npx convex deploy --prod
```

**OR if that doesn't work:**

```bash
npx convex deploy
```

This will:
1. Push your `convex/http.ts` HTTP router to production
2. Register the `/webhooks/polar` endpoint
3. Make the webhook handler available at the correct URL

## After Deployment

1. **Test the webhook:**
   - Go to Polar dashboard
   - Trigger a test webhook
   - Check logs → Should show **200 OK** (not 404)

2. **Subscribe to a plan:**
   - Go to your app's `/pricing` page
   - Subscribe to any plan
   - Complete checkout
   - Check `/settings` → Should update immediately

## Verification

After running `npx convex deploy`, you should see:
```
✓ Deployed functions to production
✓ HTTP routes registered
```

Then in Polar webhook logs:
- Before: **404 Not Found**
- After: **200 OK**

## Why This Happened

The `convex/http.ts` file was created/updated but never deployed to production. Convex needs an explicit deployment to register HTTP routes.

---

**Run this command now:**
```bash
npx convex deploy
```
