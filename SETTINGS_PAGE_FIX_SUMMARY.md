# Settings Page Not Updating - Fix Summary

## 🔍 Problem Identified

Your `/settings` page isn't updating after subscription because **all webhook events are returning 307 status codes**. This means the webhooks are being redirected and never reaching your Convex backend.

## 🎯 Root Cause

The webhook URL configured in Polar is incorrect. HTTP 307 (Temporary Redirect) indicates:
- Wrong URL endpoint
- Missing or incorrect path
- HTTP/HTTPS mismatch
- Trailing slash issue

## ✅ Solution

### 1. Update Polar Webhook URL

Go to your Polar Sandbox webhook settings and update the URL to:

```
https://scintillating-gerbil-404.convex.cloud/webhooks/polar
```

**Critical Details:**
- ✅ Use your Convex production URL (not localhost or development)
- ✅ Use HTTPS protocol
- ✅ Path must be `/webhooks/polar` (no trailing slash)
- ✅ Ensure webhook secret matches your Convex environment variable

**Where to update:**
```
https://sandbox.polar.sh/dashboard/[your-org]/settings/webhooks
```

### 2. Verify Environment Variables

In your Convex dashboard, ensure these are set:
```bash
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
POLAR_ACCESS_TOKEN=polar_sandbox_xxxxxxxxxxxxx
POLAR_SANDBOX=true
```

### 3. Deploy Updated Webhook Handler

The webhook handler has been updated to handle all event types:
```bash
npx convex deploy
```

## 📊 Webhook Events Analysis

From your logs, these events were sent (all with 307 status):

| Event Type | Status | Handler |
|------------|--------|---------|
| `subscription.created` | 307 → 200 | ✅ Handled |
| `subscription.updated` | 307 → 200 | ✅ Handled |
| `subscription.revoked` | 307 → 200 | ✅ Handled |
| `order.created` | 307 → 200 | ✅ Handled |
| `order.updated` | 307 → 200 | ✅ Handled |
| `order.paid` | 307 → 200 | ✅ Logged (informational) |
| `customer.created` | 307 → 200 | ✅ Logged (informational) |
| `customer.updated` | 307 → 200 | ✅ Logged (informational) |
| `customer.state_changed` | 307 → 200 | ✅ Logged (informational) |
| `checkout.updated` | 307 → 200 | ✅ Logged (informational) |

After fixing the URL, all these will return **200 OK** instead of **307 Redirect**.

## 🔄 How It Works (After Fix)

### Subscription Flow:
1. **User subscribes** → Polar checkout
2. **Polar sends webhooks** → Your Convex endpoint
3. **`order.created`** → Links Polar customer to Clerk user
4. **`subscription.active`** → Updates user plan in database
5. **Settings page** → Automatically updates via Convex reactivity

### Database Updates:
When `subscription.active` is received, these fields are updated:
- `subscriptionId` - Polar subscription ID
- `subscriptionPriceId` - Price ID for the plan
- `subscriptionStatus` - "active"
- `subscriptionPlan` - "Personal", "Creator", or "Business"
- `billingCycle` - "monthly" or "annual"
- `monthlyRedesignLimit` - Plan limit (50, 200, or unlimited)
- `currentPeriodEnd` - Subscription end date

### Settings Page:
The `BillingSection` component uses:
```typescript
const userData = useQuery(api.users.getUser);
const plan = userData?.subscriptionPlan || 'Free';
```

Convex automatically re-renders when the database updates, so the settings page updates in real-time.

## 🧪 Testing After Fix

1. **Update webhook URL in Polar** (see step 1 above)
2. **Deploy Convex changes:**
   ```bash
   npx convex deploy
   ```
3. **Test subscription:**
   - Go to `/pricing` page
   - Subscribe to a plan
   - Complete checkout
4. **Verify:**
   - Check Polar webhook logs → Should show **200** status
   - Go to `/settings` page → Should show new plan immediately
   - Check Convex logs → Should see "Polar webhook event received"

## 🐛 Troubleshooting

### Still getting 307?
- Double-check the URL has no trailing slash
- Verify you're using HTTPS
- Ensure path is exactly `/webhooks/polar`
- Clear any cached webhook configurations in Polar

### Getting 403 (Invalid signature)?
- Webhook secret mismatch
- Copy the signing secret from Polar webhook settings
- Update `POLAR_WEBHOOK_SECRET` in Convex environment variables
- Redeploy Convex

### Settings page still not updating?
- Open browser console for errors
- Check if `useQuery(api.users.getUser)` is returning data
- Verify user is logged in (Clerk authentication)
- Check if `polarCustomerId` is linked to user

### How to check if webhook is working:
1. Go to Convex dashboard logs
2. Look for "Polar webhook event received: subscription.active"
3. Check for any error messages
4. Verify "Event already processed" doesn't appear (idempotency working)

## 📁 Files Modified

### `convex/polar.ts`
- Added handlers for `order.updated`
- Added handlers for `customer.*` events
- Added handler for `checkout.updated`
- All events now return 200 status

### No changes needed to:
- `convex/http.ts` - Route already correct
- `convex/users.ts` - Mutation already correct
- `components/Account/BillingSection.tsx` - Query already correct

## 🎉 Expected Results

After applying the fix:
- ✅ Webhook status: 307 → **200 OK**
- ✅ Settings page updates **immediately** after subscription
- ✅ Plan, billing cycle, and limits display correctly
- ✅ No duplicate event processing
- ✅ Detailed logging in Convex dashboard

## 📞 Next Steps

1. **Update webhook URL in Polar** (most important!)
2. **Deploy Convex changes:** `npx convex deploy`
3. **Test with a subscription**
4. **Monitor webhook logs** in both Polar and Convex dashboards

---

**Quick Reference:**
- **Webhook URL:** `https://scintillating-gerbil-404.convex.cloud/webhooks/polar`
- **Polar Dashboard:** `https://sandbox.polar.sh/dashboard`
- **Convex Dashboard:** `https://dashboard.convex.dev`
