# ⚡ Quick Fix Checklist - Settings Page Not Updating

## The Problem
Webhooks returning **307 redirects** → Settings page not updating after subscription

## The Fix (2 Steps)

### ☑️ Step 1: Update Polar Webhook URL

1. Go to: `https://sandbox.polar.sh/dashboard/[your-org]/settings/webhooks`
2. Change webhook URL to:
   ```
   https://scintillating-gerbil-404.convex.cloud/webhooks/polar
   ```
3. Verify webhook secret is set
4. Save changes

### ☑️ Step 2: Deploy Convex Changes

```bash
npx convex deploy
```

## ✅ Verification

After both steps:
1. Subscribe to a plan in your app
2. Check Polar webhook logs → Should show **200** (not 307)
3. Go to `/settings` → Should show new plan immediately

## 🎯 That's It!

The webhook handler code is already correct. You just need to:
1. Point Polar to the right URL
2. Deploy the updated event handlers

---

**Need more details?** See `SETTINGS_PAGE_FIX_SUMMARY.md`
