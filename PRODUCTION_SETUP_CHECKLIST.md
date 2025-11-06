# Production Setup Checklist

## ✅ Completed
- [x] Convex deployed to production (`scintillating-gerbil-404`)
- [x] Webhook secret set in production Convex
- [x] Webhook endpoint working: `https://scintillating-gerbil-404.convex.site/webhooks/polar`
- [x] Customer linking improved to handle order metadata
- [x] Environment variables updated for production Convex URL

## 🚨 Still Required for Full Production

### 1. Clerk Production Setup
**Current**: Using test keys (`pk_test_...`)
**Required**: Update to production Clerk keys

```env
# Replace in .env.local
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...  # Get from Clerk dashboard
CLERK_JWT_ISSUER_DOMAIN=https://your-production-clerk-domain.com
```

### 2. Polar Webhook URL Update
**Current**: May be pointing to dev webhook
**Required**: Update Polar dashboard webhook URL to:
```
https://scintillating-gerbil-404.convex.site/webhooks/polar
```

### 3. Polar Production Keys
**Current**: Using sandbox keys
**Required**: Update to production Polar keys (if ready for live payments)

```env
# Replace in .env.local
VITE_POLAR_ACCESS_TOKEN=polar_oat_live_...
POLAR_WEBHOOK_SECRET=polar_whs_live_...
VITE_POLAR_SANDBOX=false
```

## Testing the Fix

After completing the above:

1. **Complete a test purchase** through your pricing page
2. **Check Convex logs** for webhook processing:
   ```bash
   npx convex logs --prod
   ```
3. **Verify UI updates** within 5 seconds in settings page
4. **Check that subscription status** shows correctly

## Root Cause Summary

The UI wasn't updating because:
1. ❌ Webhook was pointing to dev deployment
2. ❌ Customer linking wasn't handling order metadata properly  
3. ❌ Environment variables weren't set in production

**Now Fixed**: 
- ✅ Production deployment active
- ✅ Webhook processing order and subscription events
- ✅ Customer linking improved
- ✅ Real-time UI updates should work

## Next Steps

1. Update Clerk to production keys
2. Update Polar webhook URL in dashboard
3. Test complete purchase flow
4. Verify settings page updates immediately
