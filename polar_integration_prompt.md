# 🧩 Polar.sh Integration Prompt for AI Coding Agent

## Project

**ai-landscapedesigner.com**

## Stack

* **Frontend:** Vite
* **Auth:** Clerk
* **Backend:** Neon (PostgreSQL)
* **Media Storage:** Cloudinary
* **Payments:** Polar.sh

---

## Objective

Integrate and implement **Polar.sh** (starting with **sandbox.polar.sh**) into the project using the **latest official Polar documentation** available at [https://docs.polar.sh](https://docs.polar.sh).

The goal is to enable a seamless, fully functional **subscription and payment flow** powered by Polar.sh, connected with **Clerk authentication** and **Neon** database.

---

## Integration Requirements

### 1. Documentation Reference

* Reference the **latest Polar.sh documentation** at [docs.polar.sh](https://docs.polar.sh) for all SDKs, API endpoints, and integration examples.
* **Official Polar SDK:** Use `@polar-sh/sdk` for TypeScript/JavaScript integration
* Avoid assumptions — strictly follow the documented API structure and usage.
* Ensure all endpoint names, authentication methods, and webhook patterns match the live docs.

---

### 2. Environment Setup

Use **sandbox mode** for all testing.

Add these environment variables:

```env
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_at_your_sandbox_token_here
POLAR_WEBHOOK_SECRET=your_webhook_secret_here

# Application URLs
NEXT_PUBLIC_APP_URL=https://ai-landscapedesigner.com
POLAR_WEBHOOK_URL=https://ai-landscapedesigner.com/api/webhooks/polar
POLAR_SUCCESS_URL=https://ai-landscapedesigner.com/subscription/success
POLAR_CANCEL_URL=https://ai-landscapedesigner.com/pricing
```

**Important Notes:**
* Polar uses **Organization Access Tokens** (not API keys). Create them from your organization settings in the Polar dashboard
* Use `server: "sandbox"` parameter in SDK configuration for testing. Omit the parameter or use `server: "production"` for live mode
* The sandbox environment is fully isolated—data, users, tokens, and organizations created there do not affect production
* Never expose Organization Access Tokens in client-side code. Polar automatically revokes tokens detected in public repositories via GitHub Secret Scanning
* Store all credentials securely in `.env` (never commit to git)
* The webhook URL must be HTTPS (ai-landscapedesigner.com supports this)

---

### 3. Backend SDK Setup

Initialize the Polar SDK in your backend:

```typescript
// src/lib/polar.ts
import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: "sandbox", // Use for testing - omit or use 'production' for live
});
```

**Rate Limits:**
* 300 requests per minute per organization/customer
* If rate limit exceeded, you'll receive a 429 response with a Retry-After header

---

### 4. Frontend Implementation (Vite)

Integrate Polar checkout into your **Pricing Page**:

#### Display Products:
```typescript
// Fetch products from Polar API (server-side only)
const products = await polar.products.list({
  organizationId: "your_org_id",
  isArchived: false,
  isRecurring: true, // For subscription products
});
```

#### Create Checkout Session:
```typescript
// Backend API route: /api/checkout
import { polar } from '@/lib/polar';

export async function POST(request: Request) {
  const { productId, userId } = await request.json();
  
  // Verify user is authenticated via Clerk
  const clerkUser = await getClerkUser(request);
  if (!clerkUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Create or get Polar customer
  const polarCustomer = await getOrCreatePolarCustomer(clerkUser);

  // Create checkout session
  const checkout = await polar.checkouts.create({
    productId: productId,
    customerId: polarCustomer.id,
    successUrl: process.env.POLAR_SUCCESS_URL,
    metadata: {
      clerk_user_id: clerkUser.id,
    },
  });

  return Response.json({ checkoutUrl: checkout.url });
}
```

#### Frontend Checkout Flow:
* Require users to be **authenticated via Clerk** before initiating checkout
* Redirect unauthenticated users to sign-in page
* On checkout button click, call backend API to create session
* Redirect user to returned `checkout.url` (Polar-hosted checkout page)
* Handle return via success/cancel URLs

#### Customer Portal Access:
```typescript
// Backend API route: /api/portal
import { polar } from '@/lib/polar';

export async function GET(request: Request) {
  const clerkUser = await getClerkUser(request);
  const polarCustomer = await getPolarCustomer(clerkUser.id);

  const session = await polar.customerSessions.create({
    customerId: polarCustomer.id,
  });

  return Response.redirect(session.customerPortalUrl);
}
```

---

### 5. Backend Integration (Neon)

Create database tables with this schema:

#### `users` table (extend existing):
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  polar_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_polar_customer_id ON users(polar_customer_id);
```

#### `subscriptions` table:
```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  polar_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  polar_customer_id VARCHAR(255) NOT NULL,
  polar_product_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- incomplete, active, canceled, past_due, unpaid
  amount INTEGER, -- in cents
  currency VARCHAR(3) DEFAULT 'USD',
  recurring_interval VARCHAR(20), -- 'day', 'month', 'year'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  started_at TIMESTAMP,
  ends_at TIMESTAMP,
  ended_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_polar_subscription_id ON subscriptions(polar_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### `webhook_events` table (for idempotency):
```sql
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
```

---

### 6. Webhook Implementation

Configure webhook endpoint in Polar Dashboard: Settings > Webhooks. Point it to https://ai-landscapedesigner.com/api/webhooks/polar

#### Webhook Events to Subscribe:
Key events to handle:
* `checkout.created` - Checkout session created
* `checkout.updated` - Checkout status changed
* `order.created` - Order created (purchase or renewal)
* `order.paid` - Order payment completed
* `subscription.created` - New subscription started
* `subscription.active` - Subscription became active
* `subscription.updated` - Subscription modified
* `subscription.canceled` - Subscription canceled (still active until period end)
* `subscription.revoked` - Subscription access revoked (payment failure or period ended)
* `subscription.uncanceled` - Subscription cancellation reversed

#### Webhook Handler Implementation:

**Option A: Manual Implementation**
```typescript
// api/webhooks/polar/route.ts
import { headers } from 'next/headers';
import { Webhook } from 'standardwebhooks';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = headers();
  
  // Verify webhook signature
  const wh = new Webhook(Buffer.from(process.env.POLAR_WEBHOOK_SECRET!, 'utf-8').toString('base64'));
  
  let payload;
  try {
    payload = wh.verify(body, {
      'webhook-id': headersList.get('webhook-id')!,
      'webhook-signature': headersList.get('webhook-signature')!,
      'webhook-timestamp': headersList.get('webhook-timestamp')!,
    });
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);
  
  // Check idempotency
  const existingEvent = await checkWebhookExists(event.webhook_id);
  if (existingEvent) {
    return Response.json({ received: true });
  }

  // Log webhook event
  await logWebhookEvent(event);

  // Process based on event type
  try {
    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
      case 'subscription.active':
        await handleSubscriptionActive(event.data);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data);
        break;
      case 'subscription.revoked':
        await handleSubscriptionRevoked(event.data);
        break;
      // ... other events
    }
    
    await markWebhookProcessed(event.webhook_id);
    return Response.json({ received: true });
  } catch (error) {
    await logWebhookError(event.webhook_id, error);
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

**Option B: If using Next.js framework** (recommended)
```typescript
// api/webhooks/polar/route.ts
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  
  onSubscriptionCreated: async (payload) => {
    await handleSubscriptionCreated(payload.data);
  },
  
  onSubscriptionActive: async (payload) => {
    await handleSubscriptionActive(payload.data);
  },
  
  onSubscriptionUpdated: async (payload) => {
    await handleSubscriptionUpdated(payload.data);
  },
  
  onSubscriptionCanceled: async (payload) => {
    await handleSubscriptionCanceled(payload.data);
  },
  
  onSubscriptionRevoked: async (payload) => {
    await handleSubscriptionRevoked(payload.data);
  },
  
  onPayload: async (payload) => {
    // Catch-all for logging
    console.log('Webhook received:', payload.type);
  },
});
```

#### Webhook Handler Functions:

```typescript
async function handleSubscriptionCreated(subscription: any) {
  // Find user by polar_customer_id
  const user = await db.users.findOne({ 
    polar_customer_id: subscription.customer_id 
  });
  
  if (!user) {
    console.error('User not found for customer:', subscription.customer_id);
    return;
  }

  // Create subscription record
  await db.subscriptions.create({
    user_id: user.id,
    polar_subscription_id: subscription.id,
    polar_customer_id: subscription.customer_id,
    polar_product_id: subscription.product_id,
    status: subscription.status,
    amount: subscription.amount,
    currency: subscription.currency,
    recurring_interval: subscription.recurring_interval,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at,
    started_at: subscription.started_at,
    metadata: subscription.metadata,
  });
}

async function handleSubscriptionActive(subscription: any) {
  await db.subscriptions.update({
    where: { polar_subscription_id: subscription.id },
    data: { 
      status: 'active',
      started_at: subscription.started_at,
    },
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  await db.subscriptions.update({
    where: { polar_subscription_id: subscription.id },
    data: {
      status: subscription.status,
      amount: subscription.amount,
      recurring_interval: subscription.recurring_interval,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
      ends_at: subscription.ends_at,
      metadata: subscription.metadata,
    },
  });
}

async function handleSubscriptionCanceled(subscription: any) {
  // User canceled but still has access until period end
  await db.subscriptions.update({
    where: { polar_subscription_id: subscription.id },
    data: {
      status: 'canceled',
      cancel_at_period_end: true,
      canceled_at: subscription.canceled_at,
      ends_at: subscription.ends_at,
    },
  });
  
  // DO NOT revoke access immediately - wait for subscription.revoked event
}

async function handleSubscriptionRevoked(subscription: any) {
  // Access should be revoked NOW
  await db.subscriptions.update({
    where: { polar_subscription_id: subscription.id },
    data: {
      status: 'revoked',
      ended_at: subscription.ended_at,
    },
  });
  
  // Revoke premium features
  await revokeUserAccess(subscription.customer_id);
}
```

#### Important Webhook Notes:

* Base64 encode the webhook secret before using it for signature validation if rolling your own validation logic
* Webhook routes must be publicly accessible - exclude from CSRF protection middleware
* For `subscription.canceled`: Do not revoke access immediately. Wait until `subscription.revoked` event or end of billing period
* If tracking active/inactive subscriptions, handle both `subscription.active` and `subscription.revoked` events
* Always implement idempotency checks using webhook ID
* Return 200 for successfully processed events
* Return 500 for processing errors (Polar will retry)

---

### 7. User Linking (Clerk + Polar)

#### On Checkout Creation:

```typescript
async function getOrCreatePolarCustomer(clerkUser: any) {
  // Check if user already has polar_customer_id
  const user = await db.users.findOne({ 
    clerk_user_id: clerkUser.id 
  });
  
  if (user?.polar_customer_id) {
    return await polar.customers.get({ id: user.polar_customer_id });
  }
  
  // Create new Polar customer
  const customer = await polar.customers.create({
    email: clerkUser.emailAddresses[0].emailAddress,
    name: clerkUser.fullName || clerkUser.firstName,
    metadata: {
      clerk_user_id: clerkUser.id,
    },
  });
  
  // Store polar_customer_id
  await db.users.update({
    where: { clerk_user_id: clerkUser.id },
    data: { polar_customer_id: customer.id },
  });
  
  return customer;
}
```

#### Feature Access Control:

```typescript
// Middleware to check subscription status
async function requireActiveSubscription(userId: string) {
  const subscription = await db.subscriptions.findFirst({
    where: { 
      user_id: userId,
      status: { in: ['active', 'trialing'] },
    },
  });
  
  if (!subscription) {
    throw new Error('Active subscription required');
  }
  
  // Additional check: verify not past period end if canceled
  if (subscription.cancel_at_period_end) {
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    if (now > periodEnd) {
      throw new Error('Subscription expired');
    }
  }
  
  return subscription;
}
```

---

### 8. Testing & Validation

#### Sandbox Testing Checklist:

**Checkout Flow:**
- [ ] Products fetched and displayed correctly
- [ ] Unauthenticated users redirected to sign-in
- [ ] Checkout session created successfully
- [ ] User redirected to Polar checkout page
- [ ] Test payment completes (use Polar test cards)
- [ ] User redirected to success page
- [ ] Cancellation returns to pricing page

**Webhook Processing:**
- [ ] `subscription.created` event received
- [ ] `subscription.active` event activates subscription
- [ ] `subscription.updated` event updates database
- [ ] `subscription.canceled` maintains access until period end
- [ ] `subscription.revoked` removes access immediately
- [ ] Duplicate events handled (idempotency)
- [ ] Invalid signatures rejected

**Database Consistency:**
- [ ] User linked to Polar customer
- [ ] Subscription data persisted accurately
- [ ] Status changes reflected immediately
- [ ] Timestamps recorded correctly

**Feature Access:**
- [ ] Premium features unlocked after payment
- [ ] Features remain accessible during canceled period
- [ ] Features locked after revocation

#### Debugging Tools:
* Use Polar Dashboard to view webhook delivery logs
* For local development with ngrok: Configure webhook URL like `https://your-id.ngrok-free.app/api/webhooks/polar`
* Monitor database changes after each webhook
* Log all webhook events for debugging

---

### 9. Security & Best Practices

#### API Security:
* Never expose Organization Access Token in client-side code
* All subscription routes must verify Clerk authentication
* Validate user ownership before showing subscription data
* Use server-side API calls only for Polar operations

#### Webhook Security:
* Always verify webhook signatures using the secret
* Use proper signature validation with headers: webhook-id, webhook-signature, webhook-timestamp
* Log all webhook attempts
* Implement idempotency using webhook ID

#### Error Handling:
* Graceful degradation if Polar API is down
* Retry logic with exponential backoff
* Handle 429 rate limit responses using Retry-After header
* Alert monitoring for critical failures

---

### 10. Production Readiness Checklist

Before switching to production:

#### Environment Configuration:
- [ ] Update SDK to `server: "production"` (or omit parameter)
- [ ] Generate production Organization Access Token
- [ ] Update `POLAR_ACCESS_TOKEN` for production
- [ ] Create production webhook secret
- [ ] Update webhook URL in Polar dashboard to production domain
- [ ] Update success/cancel redirect URLs
- [ ] Verify HTTPS is working on all endpoints

#### Testing:
- [ ] All sandbox tests passing
- [ ] Webhook signature verification working
- [ ] Database transactions atomic
- [ ] Error handling tested
- [ ] Feature access control verified

#### Monitoring:
- [ ] Error alerting configured
- [ ] Webhook delivery monitoring
- [ ] Subscription metrics tracking
- [ ] Failed payment alerts

---

## ✅ Expected Outcome

A fully working **sandbox integration** of **Polar.sh** with:

* ✨ Smooth, secure checkout flow
* 🔒 Verified webhook handling with proper signature validation
* 💾 Accurate Neon database synchronization
* 🔗 Reliable Clerk-to-Polar customer linking
* ⚡ Real-time subscription status updates
* 🎯 Proper feature access control
* 📊 Comprehensive event logging

Ready for **production** after validation.

---

## 📚 Reference Links

* **Polar Documentation:** https://docs.polar.sh
* **API Reference:** https://docs.polar.sh/api-reference/introduction
* **TypeScript SDK:** https://docs.polar.sh/integrate/sdk/typescript
* **Webhook Events:** https://docs.polar.sh/integrate/webhooks/events
* **Checkout API:** https://docs.polar.sh/api-reference/checkouts/create-session
* **Customer Portal:** https://docs.polar.sh/features/customer-portal

---

## 🆘 Common Issues & Solutions

### Webhook Signature Validation Fails
**Solution:** 
* If rolling your own validation, base64 encode the secret before generating signature
* Verify headers are being passed correctly: webhook-id, webhook-signature, webhook-timestamp
* Check that raw request body is used (not parsed JSON)

### HTTP 403 on Webhooks
**Solution:**
* Exclude webhook route from authorization middleware
* If using Cloudflare, check firewall logs and consider disabling Bot Fight Mode

### Subscription Status Out of Sync
**Solution:**
* Ensure you're handling both `subscription.active` and `subscription.revoked` events
* Don't revoke access on `subscription.canceled` - wait for `subscription.revoked`
* Implement daily reconciliation job to sync with Polar API

---

**Final Note:**
This prompt is based on the **official Polar.sh documentation** as of October 2025. Always refer to [https://docs.polar.sh](https://docs.polar.sh) for the most current information.