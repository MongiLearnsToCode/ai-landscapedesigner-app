# 🔧 Fix Webhook 307 Redirect Issue

## Problem
Polar webhooks are returning **307 status codes**, preventing subscription updates from reaching your app.

## Solution
Update the webhook URL in Polar to point to your Convex deployment.

---

## ✅ Step-by-Step Fix

### 1. Go to Polar Sandbox Webhook Settings
```
https://sandbox.polar.sh/dashboard/[your-org]/settings/webhooks
```

### 2. Update Webhook URL to:
```
https://scintillating-gerbil-404.convex.cloud/webhooks/polar
```

**Important:**
- ✅ Use HTTPS (not HTTP)
- ✅ NO trailing slash at the end
- ✅ Path is `/webhooks/polar` (matches convex/http.ts route)

### 3. Verify Webhook Secret
Ensure the webhook secret in Polar matches your Convex environment variable:
- In Polar: Copy the webhook signing secret
- In Convex Dashboard: Set `POLAR_WEBHOOK_SECRET` environment variable

### 4. Test the Webhook
After saving:
1. Trigger a test event from Polar dashboard
2. Check webhook logs - should show **200** status (not 307)
3. Subscribe to a plan in your app
4. Verify `/settings` page updates immediately

---

## 🔍 Expected Webhook Events Flow

When a user subscribes, Polar sends these events in order:
```
1. subscription.created     → Creates subscription record
2. subscription.updated     → Updates subscription details
3. order.created           → Links customer to user
4. order.paid              → Confirms payment
5. customer.created        → Creates customer record
6. customer.state_changed  → Updates customer state
7. subscription.active     → Activates subscription ✅
```

The handler in `convex/polar.ts` processes:
- `subscription.created/updated/active` → Updates user plan
- `subscription.canceled/revoked` → Downgrades to Free
- `order.created` → Links Polar customer to Clerk user

---

## 🧪 Verification Checklist

After updating the webhook URL:

- [ ] Webhook status changes from 307 → 200
- [ ] Convex logs show "Polar webhook event received"
- [ ] User subscription data updates in database
- [ ] `/settings` page shows new plan immediately
- [ ] No duplicate event processing (idempotency working)

---

## 🐛 Troubleshooting

### Still getting 307?
- Check for trailing slash in URL
- Verify HTTPS (not HTTP)
- Ensure path is exactly `/webhooks/polar`

### Getting 403 (Invalid signature)?
- Webhook secret mismatch
- Update `POLAR_WEBHOOK_SECRET` in Convex env vars

### Getting 500 errors?
- Check Convex logs for detailed error messages
- Verify `POLAR_ACCESS_TOKEN` is set
- Ensure user has `polarCustomerId` linked

### Settings page not updating?
- Check browser console for errors
- Verify `useQuery(api.users.getUser)` is fetching data
- Clear browser cache and reload

---

## 📝 Technical Details

### Webhook Endpoint
- **File:** `convex/http.ts`
- **Route:** `/webhooks/polar`
- **Handler:** `convex/polar.ts` → `polarWebhook()`

### Database Updates
- **File:** `convex/users.ts`
- **Mutation:** `updateSubscription()`
- **Fields Updated:**
  - `subscriptionId`
  - `subscriptionPriceId`
  - `subscriptionStatus`
  - `subscriptionPlan`
  - `billingCycle`
  - `monthlyRedesignLimit`
  - `currentPeriodEnd`

### Settings Page
- **File:** `components/Account/BillingSection.tsx`
- **Query:** `useQuery(api.users.getUser)`
- **Updates:** Real-time via Convex reactivity

---

## 🎯 Quick Reference

**Correct Webhook URL:**
```
https://scintillating-gerbil-404.convex.cloud/webhooks/polar
```

**Environment Variables Required:**
```bash
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
POLAR_ACCESS_TOKEN=polar_sandbox_xxxxxxxxxxxxx
POLAR_SANDBOX=true
```

**Test Command:**
```bash
# Check Convex deployment
npx convex env list

# View webhook logs
# Go to: https://dashboard.convex.dev/
```
