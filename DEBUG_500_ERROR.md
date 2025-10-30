# 🔍 Debugging 500 Error

## Steps to Debug

### 1. Check if Deployment Completed

Run this command to ensure the latest code is deployed:
```bash
npx convex deploy --prod
```

Wait for it to complete and show:
```
✓ Deployment complete
```

### 2. Check Convex Logs

View real-time logs:
```bash
npx convex logs --prod
```

Or view in dashboard:
```
https://dashboard.convex.dev/
```

Look for the **exact error message** after "Webhook processing error:"

### 3. Verify Environment Variables

Check production environment variables are set:
```bash
npx convex env list --prod
```

Should show:
- `POLAR_WEBHOOK_SECRET`
- `POLAR_ACCESS_TOKEN`
- `POLAR_SANDBOX`
- `CLERK_JWT_ISSUER_DOMAIN`

### 4. Test Webhook Manually

Trigger a test webhook from Polar dashboard and immediately check Convex logs.

---

## Common 500 Error Causes

### A. Deployment Not Complete
**Symptom:** Old code still running
**Solution:** Wait for `npx convex deploy --prod` to finish

### B. Missing Environment Variables
**Symptom:** "POLAR_WEBHOOK_SECRET not configured"
**Solution:** Set env vars with:
```bash
npx convex env set POLAR_WEBHOOK_SECRET whsec_xxx --prod
npx convex env set POLAR_ACCESS_TOKEN polar_sandbox_xxx --prod
npx convex env set POLAR_SANDBOX true --prod
```

### C. Database Schema Issue
**Symptom:** Error about missing table or field
**Solution:** Check if `webhookEvents` table exists in schema

### D. Mutation Error
**Symptom:** Error in `logWebhookEvent` or `updateSubscription`
**Solution:** Check `convex/webhooks.ts` and `convex/users.ts`

### E. Invalid Event Structure
**Symptom:** Cannot read property of undefined
**Solution:** Log the webhook payload to see structure

---

## Diagnostic Commands

### Check Deployment Status
```bash
npx convex deploy --prod
```

### View Logs
```bash
npx convex logs --prod --tail 100
```

### List Environment Variables
```bash
npx convex env list --prod
```

### Check Functions
```bash
npx convex function-list --prod
```

---

## What to Share

To help debug, please provide:

1. **Exact error message** from Convex logs
2. **Deployment status** (did it complete successfully?)
3. **Environment variables** (are they set in production?)
4. **Webhook payload** (what does Polar send?)

---

## Quick Test

After deployment completes:

1. Go to Polar dashboard
2. Send a test webhook
3. Check Convex logs immediately
4. Share the exact error message

This will help identify the specific issue causing the 500 error.
