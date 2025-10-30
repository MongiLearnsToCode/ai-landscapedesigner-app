# ✅ Testing Guide - Verify Webhook Fix

## Deployment Status
✅ **Convex deployed to production**  
✅ HTTP routes registered  
✅ `/webhooks/polar` endpoint now available

---

## 🧪 Test Plan

### Test 1: Verify Webhook Endpoint (Quick Check)

**Option A: Test from Polar Dashboard**
1. Go to: `https://sandbox.polar.sh/dashboard/[your-org]/settings/webhooks`
2. Find your webhook configuration
3. Click "Send test event" or "Test webhook"
4. Check the response status → Should be **200 OK** (not 404)

**Option B: Check Convex Logs**
1. Go to: `https://dashboard.convex.dev/`
2. Select your project: `scintillating-gerbil-404`
3. Go to "Logs" tab
4. Look for: `"Polar webhook event received: [event-type]"`

---

### Test 2: Full Subscription Flow (Complete Test)

#### Step 1: Subscribe to a Plan
1. Go to your app: `/pricing` page
2. Click "Subscribe" on any plan (Personal, Creator, or Business)
3. Complete the Polar checkout process
4. Use test card if in sandbox mode

#### Step 2: Monitor Webhook Events
While subscribing, check Polar webhook logs:
- `https://sandbox.polar.sh/dashboard/[your-org]/settings/webhooks`
- Look for recent events
- **All should show 200 status** (not 404 or 307)

Expected events in order:
```
✅ checkout.created        - 200
✅ subscription.created    - 200
✅ order.created          - 200
✅ customer.created       - 200
✅ order.paid             - 200
✅ subscription.active    - 200
✅ customer.state_changed - 200
```

#### Step 3: Verify Settings Page
1. Go to `/settings` page in your app
2. Check the "Current Plan" section
3. **Should show:**
   - ✅ New plan name (Personal/Creator/Business)
   - ✅ Correct price
   - ✅ Billing cycle (monthly/annual)
   - ✅ Status: "active" (green badge)

#### Step 4: Check Database Update
In Convex dashboard logs, look for:
```
"Polar webhook event received: subscription.active"
"Polar webhook event received: order.created"
```

No errors should appear.

---

## 🔍 What to Look For

### ✅ Success Indicators

**In Polar Webhook Logs:**
- All events show **200 OK** status
- No 404 or 307 errors
- Events processed within seconds

**In Convex Logs:**
- "Polar webhook event received: subscription.active"
- "Polar webhook event received: order.created"
- No "Event already processed" duplicates (idempotency working)
- No error messages

**In Your App:**
- Settings page updates **immediately** (within 1-2 seconds)
- Plan name displays correctly
- Billing cycle shows correctly
- Price matches selected plan
- Status badge shows "active" in green

### ❌ Potential Issues

**If still getting 404:**
- Deployment didn't complete
- Try: `npx convex deploy` again
- Check Convex dashboard for deployment status

**If getting 403 (Invalid signature):**
- Webhook secret mismatch
- Go to Convex dashboard → Environment Variables
- Update `POLAR_WEBHOOK_SECRET` with value from Polar

**If settings page doesn't update:**
- Check browser console for errors
- Verify you're logged in (Clerk authentication)
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check Convex logs for database update errors

---

## 📊 Expected Results Summary

| Component | Before Fix | After Fix |
|-----------|------------|-----------|
| Webhook Status | 307/404 | **200 OK** |
| Settings Page | No update | **Updates immediately** |
| Database | No change | **Subscription data saved** |
| Convex Logs | No events | **Events logged** |

---

## 🎯 Quick Verification Checklist

- [ ] Polar webhooks show 200 status (not 404)
- [ ] Convex logs show "Polar webhook event received"
- [ ] Settings page displays new plan
- [ ] Plan name is correct
- [ ] Billing cycle is correct
- [ ] Status shows "active"
- [ ] No errors in browser console
- [ ] No errors in Convex logs

---

## 🐛 Troubleshooting Commands

**Check Convex deployment status:**
```bash
npx convex env list
```

**View Convex logs in terminal:**
```bash
npx convex logs --prod
```

**Re-deploy if needed:**
```bash
npx convex deploy
```

---

## 📞 Next Steps After Testing

### If Everything Works ✅
1. Document the working configuration
2. Test with different plans (monthly/annual)
3. Test subscription cancellation flow
4. Monitor for a few days to ensure stability

### If Issues Persist ❌
1. Check Convex dashboard logs for specific errors
2. Verify environment variables are set correctly
3. Ensure `polarCustomerId` is linked to user account
4. Review `convex/polar.ts` for any runtime errors

---

## 🎉 Success Criteria

Your webhook integration is working correctly when:
1. ✅ All Polar webhooks return 200 OK
2. ✅ Settings page updates within 2 seconds of subscription
3. ✅ Plan details are accurate and complete
4. ✅ No errors in Convex or browser logs
5. ✅ Subscription can be managed from settings page

---

**Start testing now!** Subscribe to a plan and watch the magic happen. 🚀
