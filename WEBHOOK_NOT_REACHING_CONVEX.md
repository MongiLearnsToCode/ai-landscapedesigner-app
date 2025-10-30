# 🚨 Webhook Not Reaching Convex

## Problem
- Polar shows **500 error**
- Convex logs show **NO webhook activity**
- Only seeing regular app functions (users:ensureUser, redesigns:getHistory, etc.)

This means the webhook isn't reaching your Convex HTTP handler at all.

## Possible Causes

### 1. HTTP Routes Not Deployed
The `convex/http.ts` file might not be deployed to production.

**Check:**
```bash
# Redeploy to ensure HTTP routes are registered
npx convex deploy --prod
```

Look for output like:
```
✓ HTTP routes registered:
  POST /webhooks/polar
```

### 2. Wrong Webhook URL
Double-check the exact URL in Polar settings.

**Should be:**
```
https://scintillating-gerbil-404.convex.site/webhooks/polar
```

**Common mistakes:**
- ❌ `.convex.cloud` instead of `.convex.site`
- ❌ Trailing slash: `/webhooks/polar/`
- ❌ Wrong path: `/polar` or `/webhook/polar`
- ❌ HTTP instead of HTTPS

### 3. Convex HTTP Actions Not Enabled
Verify HTTP actions are working.

**Test with curl:**
```bash
curl -X POST https://scintillating-gerbil-404.convex.site/webhooks/polar \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Expected:** Should see logs in Convex dashboard
**If 404:** HTTP routes not deployed
**If 500:** Handler has an error

### 4. Deployment Name Changed
Verify your deployment name hasn't changed.

**Check in Convex dashboard:**
- Go to https://dashboard.convex.dev/
- Look at your deployment URL
- Should be: `scintillating-gerbil-404.convex.site`

---

## Immediate Actions

### Step 1: Verify Webhook URL in Polar

Go to Polar dashboard:
```
https://sandbox.polar.sh/dashboard/[your-org]/settings/webhooks
```

**Confirm the URL is EXACTLY:**
```
https://scintillating-gerbil-404.convex.site/webhooks/polar
```

### Step 2: Redeploy Convex

```bash
npx convex deploy --prod
```

Wait for completion and look for:
```
✓ Deploying functions...
✓ HTTP routes registered
```

### Step 3: Test with Curl

```bash
curl -v -X POST https://scintillating-gerbil-404.convex.site/webhooks/polar \
  -H "Content-Type: application/json" \
  -d '{"type":"test","id":"123","data":{}}'
```

**Check Convex logs immediately after:**
```bash
npx convex logs --prod
```

You should see:
```
"Polar webhook received: ..."
```

### Step 4: Check Convex Dashboard

1. Go to https://dashboard.convex.dev/
2. Select your project
3. Go to "Functions" tab
4. Look for `http:polarWebhook` or similar
5. If missing, HTTP routes aren't deployed

---

## Debugging Output

### What to Check

1. **Polar webhook URL** (screenshot or copy-paste exact URL)
2. **Convex deployment name** (from dashboard)
3. **Curl test result** (does it reach Convex?)
4. **Convex functions list** (is polarWebhook listed?)

### Expected vs Actual

**Expected in Convex logs when webhook fires:**
```
"Polar webhook received: { url: '...', method: 'POST', ... }"
"Polar webhook event received: subscription.created"
```

**Actual (current):**
```
(No webhook logs at all)
```

This confirms the webhook isn't reaching Convex.

---

## Quick Diagnostic

Run these commands and share the output:

```bash
# 1. Check deployment
npx convex deploy --prod

# 2. Test endpoint
curl -X POST https://scintillating-gerbil-404.convex.site/webhooks/polar \
  -H "Content-Type: application/json" \
  -d '{"type":"test","id":"123","data":{}}'

# 3. Check logs immediately
npx convex logs --prod --tail 20
```

If curl shows 404 → HTTP routes not deployed
If curl shows 500 → Handler error (but at least it's reaching Convex)
If curl shows 200 → Webhook URL in Polar is wrong

---

## Most Likely Issue

Based on the symptoms, the most likely issue is:

**The webhook URL in Polar is incorrect or the HTTP routes aren't deployed.**

Verify:
1. URL is `.convex.site` (not `.convex.cloud`)
2. No trailing slash
3. Path is `/webhooks/polar`
4. Deployment completed successfully
