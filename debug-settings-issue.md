# Settings Page Update Issue - Debug Guide

## Issue Summary
- Polar webhook returns 200 status
- Settings page doesn't show updated plan after payment
- Need to investigate the complete flow

## Quick Fixes Applied

### 1. Enhanced BillingSection Component
- Added plan change detection with toast notifications
- Added manual refresh button
- Added better error handling for sync operations

### 2. Enhanced Webhook Logging
- Added detailed logging to order.created handler
- Added detailed logging to subscription.active handler
- Better error messages and debugging info

## Debugging Steps

### Step 1: Check if webhooks are reaching Convex
```bash
npx convex logs --prod --history 20 | grep -E "(order\.|subscription\.)"
```

### Step 2: Test the complete flow
1. Go to /pricing while logged in
2. Subscribe to any plan
3. Complete checkout with test card
4. Immediately check logs:
```bash
npx convex logs --prod --watch
```

### Step 3: Check user data in Convex dashboard
1. Open Convex dashboard
2. Go to Data tab
3. Check users table
4. Look for your user record
5. Verify these fields are updated:
   - `polarCustomerId`
   - `subscriptionPlan`
   - `subscriptionStatus`
   - `billingCycle`

### Step 4: Manual sync test
1. Go to /settings
2. Click "Sync" button
3. Check if plan updates

## Expected Webhook Flow

For a successful subscription:
1. `order.created` → Links Polar customer to Clerk user
2. `subscription.active` → Updates user's plan and limits
3. Settings page should show new plan immediately

## Common Issues

### Issue 1: order.created not received
- Check if checkout completed successfully
- Verify clerk_user_id is in order metadata
- Check webhook URL configuration

### Issue 2: subscription.active not received  
- Check if subscription actually activated in Polar
- Verify webhook events are configured correctly

### Issue 3: User not linked
- Check if polarCustomerId is set in user record
- Verify order.created handler processed successfully

## Testing Commands

### Check recent webhook events:
```bash
npx convex logs --prod --history 50 | grep "webhook"
```

### Watch for new events:
```bash
npx convex logs --prod --watch | grep -E "(order|subscription|webhook)"
```

### Check user data:
Open Convex dashboard → Data → users table

## Next Steps if Issue Persists

1. **Complete a real subscription** (not test webhooks)
2. **Monitor logs during subscription** 
3. **Check Polar dashboard** for order/subscription status
4. **Verify webhook URL** is correct in Polar settings
5. **Test manual sync** button functionality

The enhanced logging should now provide clear visibility into what's happening during the webhook processing.
