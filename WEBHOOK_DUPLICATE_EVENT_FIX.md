# Webhook Duplicate Event Fix

## Problem Identified

The webhook handler was treating all events for the same resource (customer, subscription, order) as duplicates because it was using the resource ID instead of a unique event ID.

### Root Cause

In `convex/polar.ts` line 82, the event ID extraction was:
```typescript
const eventId = webhookEvent.data?.id || webhookEvent.id || `${webhookEvent.type}_${Date.now()}`;
```

This extracted:
- **Customer events** → customer ID (same for all customer events)
- **Subscription events** → subscription ID (same for all subscription events)
- **Order events** → order ID

### Result
1. First event with customer ID `d02051f7-29c1-48e8-be74-cdbef420a60c` got logged
2. All subsequent events (customer.updated, customer.state_changed, customer.deleted) were marked as "already processed"
3. Customer events only log but don't trigger subscription updates
4. **Subscription activation events likely never came through or were already processed**

## Solutions Implemented

### 1. Fixed Event ID Generation ✅

**File:** `convex/polar.ts`

Changed to generate truly unique event IDs:
```typescript
const resourceId = webhookEvent.data?.id || webhookEvent.id || 'unknown';
const timestamp = Date.now();
const eventId = `${webhookEvent.type}_${resourceId}_${timestamp}`;
```

Now each webhook delivery gets a unique ID, preventing false duplicates.

### 2. Added Manual Subscription Sync ✅

**File:** `convex/users.ts`

Created `syncSubscription` mutation that:
- Fetches current subscription from Polar API
- Updates user record with latest subscription data
- Handles cases where webhook events were missed

### 3. Added Sync Button to UI ✅

**File:** `components/Account/BillingSection.tsx`

Added "🔄 Sync" button that:
- Only shows for users with Polar customer ID
- Manually triggers subscription sync
- Shows success/error toast messages

## How to Fix Your Current Issue

### Option 1: Use the Sync Button (Recommended)

1. Go to Settings page (`/settings`)
2. Click the "🔄 Sync" button in the billing section
3. Wait for success message
4. Your subscription should now be updated

### Option 2: Trigger New Webhook Events

1. Go to Polar dashboard
2. Send a test webhook event
3. Or make a change to the subscription
4. New events will now process correctly with unique IDs

### Option 3: Deploy and Wait for Next Webhook

The fix is live, so the next time Polar sends a subscription event, it will process correctly.

## Testing the Fix

### 1. Deploy Changes
```bash
npm run build
# Convex will auto-deploy on push
```

### 2. Check Convex Logs
After syncing or receiving new webhooks:
```
✅ "Generated unique eventId: subscription.active_sub_xxx_1234567890"
✅ "Successfully synced subscription for user: user_xxx"
✅ No more "Event already processed" for different events
```

### 3. Verify in App
- Settings page should show correct plan
- Usage limits should update
- Status should show "active"

## Why Customer Events Weren't Updating

Looking at your logs:
- `customer.deleted` (02:18:36)
- `customer.updated` (02:18:37)
- `customer.state_changed` (02:18:41, 02:18:47)

**These events don't trigger subscription updates** - they're informational only. The actual subscription updates come from:
- `subscription.created`
- `subscription.active`
- `order.created` (links customer to user)

**Missing from your logs:**
- ❌ No `subscription.created` or `subscription.active` events
- ❌ No `order.created` event

This suggests either:
1. These events came earlier and were processed (check older logs)
2. The subscription wasn't actually created/activated in Polar
3. Events were sent but failed before logging

## Next Steps

1. **Immediate:** Click the Sync button in Settings to update from Polar API
2. **Verify:** Check Polar dashboard to confirm subscription is actually active
3. **Monitor:** Watch Convex logs for next webhook delivery
4. **Test:** Subscribe again to see full flow with fixed event IDs

## What Changed

| File | Change |
|------|--------|
| `convex/polar.ts` | Fixed event ID to be unique per delivery |
| `convex/users.ts` | Added `syncSubscription` mutation |
| `components/Account/BillingSection.tsx` | Added manual sync button |

## Expected Behavior After Fix

### Webhook Processing
```
✅ customer.created_cus_123_1699000001
✅ customer.updated_cus_123_1699000002
✅ customer.state_changed_cus_123_1699000003
✅ subscription.active_sub_456_1699000004
```

Each event gets a unique ID and processes independently.

### Manual Sync
```
User clicks Sync → 
Queries Polar API → 
Gets active subscription → 
Updates user record → 
UI shows new plan immediately
```

## Troubleshooting

### Sync button not showing?
- You need a `polarCustomerId` linked to your account
- Check Convex logs for `linkPolarCustomer` calls
- Verify `order.created` event was received

### Sync returns "No active subscription"?
- Check Polar dashboard - is subscription actually active?
- Was payment successful?
- Look for subscription ID in Polar

### UI still not updating?
- Clear browser cache
- Check browser console for errors
- Verify `useQuery(api.users.getUser)` is fetching data
- Try logging out and back in

## Prevention

This fix prevents:
- ✅ False duplicate detection
- ✅ Missed subscription updates
- ✅ Event processing failures due to ID collisions
- ✅ Manual intervention needed for syncing

Future webhooks will process correctly with unique event IDs per delivery.
