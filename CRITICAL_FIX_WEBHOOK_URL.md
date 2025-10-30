# 🚨 CRITICAL: Wrong Webhook URL Domain

## The Problem

You're using the **wrong Convex domain** for webhooks!

### ❌ Current (Wrong):
```
https://scintillating-gerbil-404.convex.cloud/webhooks/polar
```

### ✅ Correct:
```
https://scintillating-gerbil-404.convex.site/webhooks/polar
```

## Why This Causes 404 Errors

Convex uses two different domains:

| Domain | Purpose | Used For |
|--------|---------|----------|
| `.convex.cloud` | Client connections | Frontend queries/mutations |
| `.convex.site` | HTTP endpoints | Webhooks, public APIs |

Your HTTP actions (webhooks) are exposed at `.convex.site`, NOT `.convex.cloud`.

## Fix It Now

1. **Go to Polar webhook settings:**
   ```
   https://sandbox.polar.sh/dashboard/[your-org]/settings/webhooks
   ```

2. **Change the webhook URL to:**
   ```
   https://scintillating-gerbil-404.convex.site/webhooks/polar
   ```

3. **Save the changes**

4. **Test immediately** - The 404 errors should become 200 OK

## How to Remember

- **`.cloud`** = ☁️ Cloud database (queries/mutations from your React app)
- **`.site`** = 🌐 Website/API (HTTP endpoints for external services)

## Verification

After updating, trigger a test webhook from Polar. You should see:
- ✅ Status: **200 OK** (not 404)
- ✅ Convex logs: "Polar webhook event received"
- ✅ Settings page updates after subscription

## Reference

From Convex documentation:
> "HTTP actions are exposed at https://<your deployment name>.convex.site"

Source: https://docs.convex.dev/functions/http-actions

---

**Update the URL now and test again!** 🚀
