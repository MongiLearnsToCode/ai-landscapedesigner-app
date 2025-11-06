# Refined Investigation Prompt: Subscription UI Update Failure

## Objective
Diagnose why the frontend UI fails to reflect subscription status after a user completes a purchase through Polar. This is a **debugging-only** task—do not rebuild or modify any existing pages or components.

## Critical Constraints
- **No reimplementation**: Inspect and debug only. All existing pages (especially pricing) must remain untouched.
- **Documentation sources**: Rely exclusively on official live documentation:
  - https://docs.polar.sh
  - https://clerk.com/docs
  - https://docs.convex.dev
- **Preserve existing behavior**: Changes must be surgical and localized to the bug.

---

## 1. Issue Reproduction

### Required Information
Document the exact reproduction path:

**Environment**
- Deployment: [dev/staging/production]
- Browser: [name + version]
- User state: [logged in/out, existing subscriber/new user]
- Polar product/tier being purchased
- Feature flags or A/B test variants active

**Steps to Reproduce**
```
1. [Precise action, e.g., "Navigate to /pricing as logged-out user"]
2. [e.g., "Click 'Subscribe' on Pro tier"]
3. [e.g., "Complete Polar checkout with test card"]
4. [e.g., "Return to app via redirect"]
5. [Observed: UI still shows 'Free' tier]
6. [Expected: UI shows 'Pro' tier badge + unlocked features]
```

**Observed vs. Expected**
- What UI elements fail to update? (badges, navigation, feature gates, account settings)
- Does a hard refresh fix it? Does logging out/in fix it?
- Timing: Does it eventually update (delayed) or never?

---

## 2. Investigation Areas

### A. Polar → Backend Flow

**Checkout completion**
- [ ] Which Polar API endpoint confirms subscription? (`POST /checkout/confirm` or webhook?)
- [ ] Network trace: Inspect redirect URL parameters after checkout
- [ ] Does frontend send a completion signal to backend, or rely purely on webhooks?

**Webhook configuration**
- [ ] Verify webhook URL registered in Polar dashboard
- [ ] Check webhook authentication (signature verification in code)
- [ ] Inspect webhook delivery logs in Polar dashboard:
  - Response codes (200s vs errors)
  - Retry attempts
  - Payload examples for successful subscriptions
- [ ] Backend endpoint handling webhook:
  - File/route location
  - Request logging (does it ever receive events?)
  - Error handling (are exceptions caught and swallowed?)

**Event payload processing**
- [ ] Which Polar events trigger updates? (`subscription.created`, `checkout.completed`, etc.)
- [ ] How is the Polar customer ID mapped to your internal user ID?
- [ ] Where is subscription data extracted from the payload?

---

### B. Backend → Convex/Clerk Sync

**Clerk metadata updates**
- [ ] Does the webhook handler update Clerk user metadata (`publicMetadata` or `privateMetadata`)?
- [ ] Which Clerk API method is used? (`clerkClient.users.updateUser()`)
- [ ] Are updates synchronous or queued?
- [ ] Check Clerk dashboard: Does user metadata reflect subscription after purchase?

**Convex data writes**
- [ ] Which Convex mutation/action is called to store subscription state?
- [ ] Inspect Convex dashboard:
  - Does a subscription record appear in the database after purchase?
  - Check timestamps—does it write immediately or with delay?
- [ ] Table/collection name and schema for subscriptions
- [ ] Is the write transactional? Could it be rolled back silently?

**Backend error handling**
- [ ] Search server logs for webhook processing errors
- [ ] Check for database constraint violations or validation failures
- [ ] Look for timeout errors if external API calls are involved

---

### C. Convex → Frontend Sync

**Real-time subscriptions**
- [ ] Which Convex query provides subscription status to the frontend?
- [ ] Is the query reactive (auto-updates on data change)?
- [ ] Inspect frontend code: Where is `useQuery()` or equivalent called?
- [ ] Does the query filter by correct user ID (from Clerk session)?

**Frontend state management**
- [ ] Which React context/store/state holds subscription status?
- [ ] When is this state initialized? (on mount, auth change, route change?)
- [ ] Check for stale closures or missing dependencies in `useEffect`

**Cache behavior**
- [ ] Does Convex client cache queries? Is cache invalidation working?
- [ ] Are there manual `refetch()` calls that might be missing?
- [ ] Check browser DevTools: Does Convex websocket show live updates after purchase?

---

### D. Frontend UI Logic

**Conditional rendering**
- [ ] Find where subscription tier determines UI visibility (components, routes, nav items)
- [ ] Check for hardcoded fallbacks or default states
- [ ] Look for race conditions (e.g., rendering before auth/data is ready)

**Session token freshness**
- [ ] If relying on Clerk JWT claims for subscription status:
  - When are tokens refreshed?
  - Does the frontend have the latest token after webhook updates Clerk metadata?
  - Consider: Clerk tokens are cached; metadata changes may require `session.reload()`

**Event listeners**
- [ ] Are there event handlers for Polar redirect callbacks?
- [ ] Does the frontend poll or wait for push updates?
- [ ] Check for missing cleanup (unmounted listeners)

---

## 3. Diagnostic Evidence to Collect

### Traces and Logs
1. **Browser Network tab**:
   - Polar checkout redirect with query params
   - API calls after redirect (auth refresh, subscription fetch)
   - WebSocket messages (Convex real-time updates)

2. **Server logs**:
   - Webhook receipt confirmation
   - Payload content (sanitized)
   - Convex mutation execution logs
   - Clerk API call responses

3. **Convex dashboard**:
   - Query results for subscription data
   - Function execution logs (mutations/actions)
   - Real-time update events

4. **Clerk dashboard**:
   - User metadata after purchase
   - Session activity/token refresh events

### Code References
Document file paths and line numbers for:
- Polar webhook handler
- Convex subscription mutations
- Frontend subscription query/hook
- UI components showing subscription status

---

## 4. Root Cause Analysis

Provide a **single-paragraph summary** answering:
- Where does the data flow break? (Polar → Webhook → Backend → Convex/Clerk → Frontend)
- What is the missing link? (webhook not received, mutation not called, query not reactive, UI not listening, token not refreshed, etc.)
- Include specific evidence (log snippet, missing network call, incorrect query result)

---

## 5. Recommended Fix

### Quick Patch
- **What**: Minimal code change to restore UI updates
- **Where**: Exact file and line numbers
- **How**: Code diff or pseudocode
- **Risk**: [Low/Medium/High] - potential side effects

### Alternative Solutions (if applicable)
If the quick patch is a workaround, describe:
- Proper long-term fix (e.g., migrate from polling to webhooks)
- Trade-offs and implementation effort

### Testing Strategy
- How to verify the fix works in reproduction environment
- Regression checks (ensure pricing page and other flows unaffected)

---

## 6. Deliverables Checklist

- [ ] Step-by-step reproduction guide
- [ ] Root cause paragraph with evidence
- [ ] Network traces and relevant log snippets
- [ ] Recommended fix with code references
- [ ] (Optional) Pull request or patch file

---

## Acceptance Criteria

✅ **Success**: After applying the fix:
1. User completes Polar subscription
2. Frontend UI reflects new subscription status **within 5 seconds** without manual refresh
3. All existing pages (pricing, dashboard, etc.) function identically
4. No console errors or failed network requests

✅ **Validation**: Test in the exact reproduction environment documented in section 1

---

## Assumptions & Fallbacks

- If the bug is due to a third-party service limitation (Polar webhook latency, Clerk metadata propagation delay, Convex real-time lag), document it with links to provider documentation
- If no fix is possible without architectural changes, propose a **user-facing mitigation** (e.g., "refresh" button, loading state, polling fallback)