# 🔍 Debug: Settings Page Not Updating

## Current Status
✅ Webhooks working (200 status)
✅ Events being received in Convex
❌ Settings page not updating

## What I See in Logs

Events received:
- `order.updated` - Processed ✅
- `customer.state_changed` - Processed ✅
- `customer.deleted` - Unhandled (expected)
- `subscription.revoked` - Error: "Subscription missing customerId"

## Missing Events

I don't see these critical events in your logs:
- ❌ `order.created` - Links Polar customer to Clerk user
- ❌ `subscription.active` - Updates user's subscription plan

## The Flow Should Be

When a user subscribes:
1. **`order.created`** → Links `polarCustomerId` to `clerkUserId`
2. **`subscription.active`** → Updates user's plan using `polarCustomerId`
3. Settings page → Reads user data → Shows new plan

## Why Settings Page Isn't Updating

### Possible Issue 1: order.created Never Fired
Without `order.created`, the Polar customer is never linked to the Clerk user, so `subscription.active` can't find who to update.

**Check:**
- Did you complete a real checkout flow?
- Or just send test webhooks?

**Test webhooks** might not include `order.created`. You need to **actually subscribe** to trigger the full flow.

### Possible Issue 2: subscription.active Event Missing
The logs show `subscription.revoked` but not `subscription.active`.

**Check:**
- Did the subscription actually activate?
- Is the subscription status "active" in Polar dashboard?

### Possible Issue 3: Clerk User ID Not in Metadata
The `order.created` handler checks for:
```typescript
order.customer?.metadata?.clerk_user_id
```

If this metadata isn't set during checkout, the customer won't be linked.

**Check:** When creating the checkout, do you pass the Clerk user ID in metadata?

## What to Do Now

### Step 1: Check Polar Dashboard

Go to Polar dashboard and check:
1. **Orders** - Is there an order with status "paid"?
2. **Subscriptions** - Is there a subscription with status "active"?
3. **Customers** - Does the customer have `clerk_user_id` in metadata?

### Step 2: Do a Real Subscription Test

1. **Go to `/pricing` page** in your app (while logged in)
2. **Click subscribe** on any plan
3. **Complete the checkout** (use test card if sandbox)
4. **Immediately check Convex logs** for this sequence:
   ```
   order.created
   subscription.created
   customer.created (maybe)
   order.paid (maybe)
   subscription.active
   ```

### Step 3: Check Convex Logs During Subscription

Run this while subscribing:
```bash
npx convex logs --prod --watch
```

Look for:
- `order.created` with clerk_user_id in metadata
- `subscription.active` event
- Any errors in the handlers

### Step 4: Check User Data in Convex

After subscribing, check if the user record was updated:

1. Go to Convex dashboard
2. Open "Data" tab
3. Look at "users" table
4. Find your user (by email or clerkUserId)
5. Check these fields:
   - `polarCustomerId` - Should be set
   - `subscriptionPlan` - Should be set (Personal/Creator/Business)
   - `subscriptionStatus` - Should be "active"
   - `billingCycle` - Should be "monthly" or "annual"

## Diagnostic Questions

Please check and answer:

1. **Did you complete a real checkout?**
   - ❌ No, just sent test webhooks → Do a real checkout
   - ✅ Yes, completed checkout → Check next question

2. **Are you seeing `order.created` in logs?**
   - ❌ No → Checkout didn't complete properly
   - ✅ Yes → Check next question

3. **Are you seeing `subscription.active` in logs?**
   - ❌ No → Subscription didn't activate
   - ✅ Yes → Check if user data updated

4. **Is the Clerk user ID being passed in checkout metadata?**
   - Need to check the checkout code in `services/polarService.ts` or `pages/PricingPage.tsx`

## Next Steps Based on Logs

**If you see `order.created` AND `subscription.active` but settings page doesn't update:**
→ Check the BillingSection component's query

**If you DON'T see `order.created`:**
→ Check if clerk_user_id is being passed in checkout metadata

**If you DON'T see `subscription.active`:**
→ Check Polar dashboard if subscription is actually active

**If you see errors in handlers:**
→ Share the complete error message

## Quick Test Command

Run this and then do a real subscription:
```bash
npx convex logs --prod --watch | grep -E "(order\.|subscription\.)"
```

This will show only order and subscription events, making it easier to see what's happening.

---

**Share the results of:**
1. Complete a real subscription flow
2. The Convex logs during subscription
3. Whether order.created and subscription.active appear
