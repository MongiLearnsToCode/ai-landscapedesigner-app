# Debug: Polar 500 Error with No Convex Logs

## Symptoms
- ✅ Curl test works (Convex receives and logs the request)
- ❌ Polar webhooks get 500 error
- ❌ No logs appear in Convex when Polar sends webhooks

## This Suggests

Polar is likely **not sending to the Convex URL at all**, or there's a proxy/redirect happening.

## Things to Check in Polar Dashboard

### 1. Webhook Delivery Details

Click on a failed webhook in Polar to see:

**URL Section:**
- What URL did Polar actually send to?
- Is it exactly `https://scintillating-gerbil-404.convex.site/webhooks/polar`?

**Response Section:**
- What status code? (500)
- What response body/error message?
- This will tell us WHO is returning the 500 (Polar's proxy? Vercel? Convex?)

**Request Headers:**
- What headers did Polar send?
- Look for any proxy headers

### 2. Multiple Endpoints?

- Do you have **multiple webhook endpoints** configured in Polar?
- Check if one is pointing to old URL (like `.convex.cloud` or `/api/webhooks`)
- Delete any old endpoints

### 3. Webhook Secret

- Is the webhook secret set in Polar?
- Copy the EXACT secret from Polar
- Set it in Convex:
  ```bash
  npx convex env set POLAR_WEBHOOK_SECRET "whsec_actual_secret_here" --prod
  ```

## Possible Issues

### Issue A: Polar is Caching Old URL

**Solution:** Delete and recreate webhook endpoint

1. In Polar dashboard, delete the webhook endpoint completely
2. Wait 1 minute
3. Create new endpoint with: `https://scintillating-gerbil-404.convex.site/webhooks/polar`
4. Select all event types
5. Set webhook secret
6. Save
7. Send test webhook

### Issue B: Polar is Sending to a Different URL

**Check:** In Polar's webhook delivery log, verify the EXACT URL

**If different:**
- Update to correct URL
- Remove trailing slashes
- Use `.convex.site` not `.convex.cloud`

### Issue C: Webhook Secret Format Issue

**Polar's secret format:** Starts with `whsec_`

**In Convex, set exactly as shown in Polar:**
```bash
npx convex env set POLAR_WEBHOOK_SECRET "whsec_xxxxxxxxxxxxx" --prod
```

### Issue D: Wrong Deployment

**Check deployment name:**
```bash
npx convex info --prod
```

Should show: `scintillating-gerbil-404`

If different, use the correct deployment name in URL.

### Issue E: Convex Site vs Cloud Confusion

**For webhooks, MUST use `.convex.site`**
- ❌ `https://scintillating-gerbil-404.convex.cloud` (for client connections)
- ✅ `https://scintillating-gerbil-404.convex.site` (for HTTP actions)

## Diagnostic Test

### Test 1: Curl Works
```bash
curl -X POST https://scintillating-gerbil-404.convex.site/webhooks/polar \
  -H "Content-Type: application/json" \
  -d '{"type":"test","id":"123","data":{}}'
```

✅ This worked - endpoint is correct

### Test 2: What URL is Polar Using?

In Polar webhook delivery log, check:
- Request URL
- Response body
- Response headers

**Share this info to debug further.**

## Next Steps

1. **Send a test webhook from Polar** right now
2. **Immediately check Convex logs:** `npx convex logs --prod --tail 50`
3. **Check Polar delivery log** - click on the failed delivery
4. **Share the following:**
   - Exact URL from Polar delivery log
   - Response body from Polar delivery log
   - Whether any logs appeared in Convex (even errors)

## Theory

Since curl works but Polar doesn't, one of these is true:
1. Polar is sending to a different URL than configured
2. Polar's webhook format/headers cause a crash before logging
3. There's a proxy/cache between Polar and Convex
4. Multiple webhook endpoints exist, one wrong

**Check the Polar delivery log to see the actual URL and response!**
