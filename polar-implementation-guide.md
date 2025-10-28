# Polar.sh Integration Implementation Guide
## AI Landscape Designer - Complete Implementation Plan

---

## Phase 1: Polar.sh Setup & Configuration

### 1.1 Create Polar.sh Account & Products

#### Sandbox Environment Setup
1. Go to [Polar.sh Sandbox](https://sandbox.polar.sh)
2. Create an account and organization
3. Navigate to **Products** → **Create Product**

#### Create Three Products:
```
Product 1: Personal Plan
- Name: Personal
- Description: For casual users or hobbyists
- Type: Subscription
- Price: $12/month or $120/year
- Benefits:
  * 50 redesigns per month
  * All design styles
  * Image editing tools
  * Advanced customization

Product 2: Creator Plan (Popular)
- Name: Creator
- Description: For regular creators & freelancers
- Type: Subscription
- Price: $29/month or $240/year
- Benefits:
  * 200 redesigns per month
  * All design styles
  * Image editing tools
  * Advanced customization

Product 3: Business Plan
- Name: Business
- Description: For teams, agencies & power users
- Type: Subscription
- Price: $60/month or $480/year
- Benefits:
  * Unlimited redesigns
  * All design styles
  * Image editing tools
  * Advanced customization
  * Priority support
```

#### Get API Keys
1. Navigate to **Settings** → **API**
2. Copy your **Access Token**
3. Copy your **Webhook Secret**

---

## Phase 2: Environment & Dependencies

### 2.1 Update Environment Variables

**File: `.env.example`**
```env
# AI Landscape Designer Environment Variables

# Gemini API Key (required for AI image generation)
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Resend API Key (required for contact form emails - server-side only)
RESEND_API_KEY=re_your_actual_api_key_here

# Cloudinary Configuration (required for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset

# Clerk Configuration (required for authentication)
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key

# Convex Configuration
CONVEX_DEPLOYMENT=your-convex-deployment-url
VITE_CONVEX_URL=your-convex-url

# Polar.sh Configuration (Sandbox)
VITE_POLAR_ACCESS_TOKEN=polar_sandbox_xxxxxxxxxx
POLAR_WEBHOOK_SECRET=polar_wh_xxxxxxxxxx
VITE_POLAR_ORGANIZATION_ID=your-org-id

# Polar.sh Product IDs (Sandbox)
VITE_POLAR_PRODUCT_PERSONAL_MONTHLY=prod_xxxxxxxxxx
VITE_POLAR_PRODUCT_PERSONAL_YEARLY=prod_xxxxxxxxxx
VITE_POLAR_PRODUCT_CREATOR_MONTHLY=prod_xxxxxxxxxx
VITE_POLAR_PRODUCT_CREATOR_YEARLY=prod_xxxxxxxxxx
VITE_POLAR_PRODUCT_BUSINESS_MONTHLY=prod_xxxxxxxxxx
VITE_POLAR_PRODUCT_BUSINESS_YEARLY=prod_xxxxxxxxxx

# Production Toggle (set to 'true' for production)
VITE_POLAR_SANDBOX=true
```

### 2.2 Install Dependencies

Run: `npm install @polar-sh/sdk`

---

## Phase 3: Database Schema Updates

### 3.1 Update Convex Schema

**File: `convex/schema.ts`**
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    // Subscription tracking
    polarCustomerId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()), // active, canceled, past_due
    subscriptionPlan: v.optional(v.string()), // Personal, Creator, Business, Free
    subscriptionId: v.optional(v.string()), // Polar subscription ID
    subscriptionPriceId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()), // timestamp
    // Monthly limits
    monthlyRedesignLimit: v.optional(v.number()),
    redesignsUsedThisMonth: v.optional(v.number()),
    currentMonthStart: v.optional(v.number()), // timestamp
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_polar_customer", ["polarCustomerId"]),

  redesigns: defineTable({
    clerkUserId: v.string(),
    redesignId: v.string(),
    originalImageUrl: v.string(),
    redesignedImageUrl: v.string(),
    designCatalog: v.any(),
    styles: v.any(),
    climateZone: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  })
    .index("by_user", ["clerkUserId"])
    .index("by_redesign_id", ["redesignId"])
    .index("by_user_and_date", ["clerkUserId", "createdAt"]),

  // Webhook events log (for debugging and idempotency)
  webhookEvents: defineTable({
    eventId: v.string(), // Polar event ID
    eventType: v.string(),
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    payload: v.any(),
  }).index("by_event_id", ["eventId"]),
});
```

Run: `npx convex dev` to apply schema changes

---

## Phase 4: Backend Implementation (Convex)

### 4.1 Create User Management Functions

**NEW FILE: `convex/users.ts`**
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Ensure user exists and get/create user
export const ensureUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create new user with free tier defaults
    return await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      email: args.email,
      name: args.name,
      subscriptionStatus: "active",
      subscriptionPlan: "Free",
      monthlyRedesignLimit: 3,
      redesignsUsedThisMonth: 0,
      currentMonthStart: Date.now(),
    });
  },
});

// Get user profile
export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    return user;
  },
});

// Update subscription from webhook
export const updateSubscription = mutation({
  args: {
    polarCustomerId: v.string(),
    subscriptionId: v.string(),
    subscriptionPriceId: v.string(),
    status: v.string(),
    plan: v.string(),
    limit: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_polar_customer", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found for customer ID");
    }

    await ctx.db.patch(user._id, {
      subscriptionId: args.subscriptionId,
      subscriptionPriceId: args.subscriptionPriceId,
      subscriptionStatus: args.status,
      subscriptionPlan: args.plan,
      monthlyRedesignLimit: args.limit,
      currentPeriodEnd: args.currentPeriodEnd,
    });
  },
});

// Link Polar customer ID
export const linkPolarCustomer = mutation({
  args: {
    clerkUserId: v.string(),
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      polarCustomerId: args.polarCustomerId,
    });
  },
});
```

### 4.2 Update Redesigns Functions

**UPDATE FILE: `convex/redesigns.ts`**
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to reset monthly counter if needed
const checkAndResetMonthlyUsage = async (ctx: any, user: any) => {
  const now = Date.now();
  const monthStart = user.currentMonthStart || now;
  const daysSinceStart = (now - monthStart) / (1000 * 60 * 60 * 24);

  if (daysSinceStart >= 30) {
    await ctx.db.patch(user._id, {
      redesignsUsedThisMonth: 0,
      currentMonthStart: now,
    });
    return { ...user, redesignsUsedThisMonth: 0, currentMonthStart: now };
  }

  return user;
};

// Get history
export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("redesigns")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .order("desc")
      .collect();
  },
});

// Check limit with subscription awareness
export const checkLimit = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        used: 0,
        limit: 3,
        remaining: 0,
        hasReachedLimit: true,
        isAuthenticated: false,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      return {
        used: 0,
        limit: 3,
        remaining: 3,
        hasReachedLimit: false,
        isAuthenticated: true,
      };
    }

    // Check if we need to reset monthly counter
    const now = Date.now();
    const monthStart = user.currentMonthStart || now;
    const daysSinceStart = (now - monthStart) / (1000 * 60 * 60 * 24);
    const shouldReset = daysSinceStart >= 30;

    const used = shouldReset ? 0 : (user.redesignsUsedThisMonth || 0);
    const limit = user.monthlyRedesignLimit || 3;
    const isUnlimited = user.subscriptionPlan === "Business";

    return {
      used,
      limit: isUnlimited ? 999999 : limit,
      remaining: isUnlimited ? 999999 : Math.max(0, limit - used),
      hasReachedLimit: isUnlimited ? false : used >= limit,
      isAuthenticated: true,
      plan: user.subscriptionPlan || "Free",
      isUnlimited,
    };
  },
});

// Save redesign with usage tracking
export const saveRedesign = mutation({
  args: {
    redesignId: v.string(),
    originalImageUrl: v.string(),
    redesignedImageUrl: v.string(),
    designCatalog: v.any(),
    styles: v.any(),
    climateZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check and reset monthly usage if needed
    const updatedUser = await checkAndResetMonthlyUsage(ctx, user);

    // Check if limit reached (unless unlimited)
    const isUnlimited = updatedUser.subscriptionPlan === "Business";
    if (!isUnlimited) {
      const used = updatedUser.redesignsUsedThisMonth || 0;
      const limit = updatedUser.monthlyRedesignLimit || 3;
      if (used >= limit) {
        throw new Error("Monthly redesign limit reached");
      }
    }

    // Save redesign
    const id = await ctx.db.insert("redesigns", {
      ...args,
      clerkUserId: identity.subject,
      isPinned: false,
      createdAt: Date.now(),
    });

    // Increment usage counter
    if (!isUnlimited) {
      await ctx.db.patch(updatedUser._id, {
        redesignsUsedThisMonth: (updatedUser.redesignsUsedThisMonth || 0) + 1,
      });
    }

    return id;
  },
});

// Toggle pin
export const togglePin = mutation({
  args: { redesignId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const redesign = await ctx.db
      .query("redesigns")
      .withIndex("by_redesign_id", (q) => q.eq("redesignId", args.redesignId))
      .unique();

    if (!redesign) throw new Error("Not found");
    if (redesign.clerkUserId !== identity.subject)
      throw new Error("Not authorized");

    await ctx.db.patch(redesign._id, {
      isPinned: !redesign.isPinned,
    });
  },
});

// Delete redesign
export const deleteRedesign = mutation({
  args: { redesignId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const redesign = await ctx.db
      .query("redesigns")
      .withIndex("by_redesign_id", (q) => q.eq("redesignId", args.redesignId))
      .unique();

    if (!redesign) throw new Error("Not found");
    if (redesign.clerkUserId !== identity.subject)
      throw new Error("Not authorized");

    await ctx.db.delete(redesign._id);
  },
});
```

### 4.3 Create Webhook Handler Functions

**NEW FILE: `convex/webhooks.ts`**
```typescript
import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Log webhook event (for idempotency)
export const logWebhookEvent = mutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if already processed
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .unique();

    if (existing) {
      return { alreadyProcessed: true };
    }

    // Log event
    await ctx.db.insert("webhookEvents", {
      eventId: args.eventId,
      eventType: args.eventType,
      payload: args.payload,
      processed: false,
    });

    return { alreadyProcessed: false };
  },
});

// Mark webhook as processed
export const markWebhookProcessed = mutation({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .unique();

    if (!event) throw new Error("Event not found");

    await ctx.db.patch(event._id, {
      processed: true,
      processedAt: Date.now(),
    });
  },
});
```

---

## Phase 5: Webhook Endpoint

### 5.1 Create Polar Webhook Handler

**NEW FILE: `api/webhooks/polar.ts`**
```typescript
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

// Plan limits mapping
const PLAN_LIMITS: Record<string, { plan: string; limit: number }> = {
  Personal: { plan: 'Personal', limit: 50 },
  Creator: { plan: 'Creator', limit: 200 },
  Business: { plan: 'Business', limit: 999999 },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET!;
    
    // Verify webhook using SDK method
    let event;
    try {
      event = validateEvent(
        req.body, 
        req.headers, 
        webhookSecret
      );
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        console.error('Webhook verification failed:', err);
        return res.status(403).json({ error: 'Invalid signature' });
      }
      throw err;
    }

    console.log('Polar webhook received:', event.type);

    // Check if already processed (idempotency)
    const logResult = await convex.mutation(api.webhooks.logWebhookEvent, {
      eventId: event.id,
      eventType: event.type,
      payload: event,
    });

    if (logResult.alreadyProcessed) {
      console.log('Event already processed:', event.id);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Handle different event types
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
        await handleSubscriptionActive(event.data);
        break;

      case 'subscription.canceled':
      case 'subscription.revoked':
        await handleSubscriptionCanceled(event.data);
        break;

      case 'order.created':
        await handleOrderCreated(event.data);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    // Mark as processed
    await convex.mutation(api.webhooks.markWebhookProcessed, {
      eventId: event.id,
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSubscriptionActive(subscription: any) {
  const customerId = subscription.customerId;
  const productName = subscription.product.name;
  const planConfig = PLAN_LIMITS[productName] || { plan: 'Free', limit: 3 };

  await convex.mutation(api.users.updateSubscription, {
    polarCustomerId: customerId,
    subscriptionId: subscription.id,
    subscriptionPriceId: subscription.priceId,
    status: 'active',
    plan: planConfig.plan,
    limit: planConfig.limit,
    currentPeriodEnd: new Date(subscription.currentPeriodEnd).getTime(),
  });
}

async function handleSubscriptionCanceled(subscription: any) {
  const customerId = subscription.customerId;

  await convex.mutation(api.users.updateSubscription, {
    polarCustomerId: customerId,
    subscriptionId: subscription.id,
    subscriptionPriceId: subscription.priceId,
    status: 'canceled',
    plan: 'Free',
    limit: 3,
    currentPeriodEnd: new Date(subscription.currentPeriodEnd).getTime(),
  });
}

async function handleOrderCreated(order: any) {
  // Link Polar customer to Clerk user if metadata exists
  if (order.customerMetadata?.clerk_user_id) {
    await convex.mutation(api.users.linkPolarCustomer, {
      clerkUserId: order.customerMetadata.clerk_user_id,
      polarCustomerId: order.customerId,
    });
  }
}
```

---

## Phase 6: Frontend Integration

### 6.1 Create Polar Service

**NEW FILE: `services/polarService.ts`**
```typescript
import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
  accessToken: import.meta.env.VITE_POLAR_ACCESS_TOKEN,
  server: import.meta.env.VITE_POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
});

export interface CheckoutConfig {
  productPriceId: string;
  successUrl: string;
  customerEmail: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export const createCheckout = async (config: CheckoutConfig) => {
  try {
    const checkout = await polar.checkouts.custom.create({
      productPriceId: config.productPriceId,
      successUrl: config.successUrl,
      customerEmail: config.customerEmail,
      customerId: config.customerId,
      customerMetadata: config.metadata,
    });

    return checkout;
  } catch (error) {
    console.error('Polar checkout error:', error);
    throw error;
  }
};

export const getCustomerPortalUrl = async (customerId: string) => {
  try {
    const session = await polar.customerSessions.create({
      customerId,
    });
    
    // Return the portal URL with the customer session token
    return `https://polar.sh/customer-portal?customer_session_token=${session.customerSessionToken}`;
  } catch (error) {
    console.error('Customer portal error:', error);
    throw error;
  }
};

export { polar };
```

### 6.2 Update Pricing Page - Add Checkout Handler

Add to `pages/PricingPage.tsx` imports:
```typescript
import { createCheckout } from '../services/polarService';
import { useUser } from '@clerk/clerk-react';
import { useToastStore } from '../stores/toastStore';
import { useState } from 'react';
```

Add state and handler:
```typescript
const { user: clerkUser } = useUser();
const { addToast } = useToastStore();
const [isCheckingOut, setIsCheckingOut] = useState(false);

const handleSubscribe = async (plan: string, billingCycle: BillingCycle) => {
  if (!clerkUser) {
    onNavigate('signin');
    return;
  }

  setIsCheckingOut(true);
  try {
    const productMap: Record<string, Record<string, string>> = {
      Personal: {
        monthly: import.meta.env.VITE_POLAR_PRODUCT_PERSONAL_MONTHLY,
        annual: import.meta.env.VITE_POLAR_PRODUCT_PERSONAL_YEARLY,
      },
      Creator: {
        monthly: import.meta.env.VITE_POLAR_PRODUCT_CREATOR_MONTHLY,
        annual: import.meta.env.VITE_POLAR_PRODUCT_CREATOR_YEARLY,
      },
      Business: {
        monthly: import.meta.env.VITE_POLAR_PRODUCT_BUSINESS_MONTHLY,
        annual: import.meta.env.VITE_POLAR_PRODUCT_BUSINESS_YEARLY,
      },
    };

    const productPriceId = productMap[plan][billingCycle];
    
    const checkout = await createCheckout({
      productPriceId,
      successUrl: `${window.location.origin}/success`,
      customerEmail: clerkUser.primaryEmailAddress?.emailAddress || '',
      metadata: {
        clerk_user_id: clerkUser.id,
      },
    });

    window.location.href = checkout.url;
  } catch (error) {
    console.error('Checkout error:', error);
    addToast('Failed to start checkout. Please try again.', 'error');
  } finally {
    setIsCheckingOut(false);
  }
};
```

Update PlanCard to accept onClick and pass handler.

### 6.3 Update Profile Page - Add Subscription Management

Add to `pages/ProfilePage.tsx`:
```typescript
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { getCustomerPortalUrl } from '../services/polarService';
```

Update SubscriptionContent to fetch from Convex and handle portal link.

---

## Phase 7: Testing Checklist

### Sandbox Testing

#### Setup
- [ ] Polar.sh sandbox account created
- [ ] Three products created with monthly/yearly prices
- [ ] API keys added to `.env`
- [ ] Webhook endpoint configured in Polar (should point to `/api/webhooks/polar`)
- [ ] Convex schema deployed
- [ ] Use Express raw body parser: `express.raw({ type: "application/json" })`

#### Checkout Flow
- [ ] Click pricing button → redirects to Polar
- [ ] Complete with test card: `4242 4242 4242 4242`
- [ ] Redirects to success page
- [ ] Webhook `order.created` received and processed
- [ ] Webhook `subscription.active` received (for subscriptions)
- [ ] Database updated with customer link
- [ ] Limits updated correctly

#### Subscription Management
- [ ] Profile shows correct plan
- [ ] "Manage Subscription" creates customer session
- [ ] Portal opens with correct customer session token
- [ ] Can view subscription details
- [ ] Can cancel subscription
- [ ] Cancellation webhook `subscription.canceled` received
- [ ] Limits revert to free tier

#### Usage Limits
- [ ] Free: 3 redesigns
- [ ] Personal: 50/month
- [ ] Creator: 200/month
- [ ] Business: Unlimited
- [ ] Monthly reset works (30-day rolling window)
- [ ] Error shown when limit reached

#### Webhook Events
- [ ] `subscription.created` → activates subscription
- [ ] `subscription.updated` → updates details
- [ ] `subscription.active` → confirms active status
- [ ] `subscription.canceled` → downgrades to free
- [ ] `subscription.revoked` → removes access
- [ ] `order.created` → links customer to user
- [ ] Duplicate events ignored (idempotency check works)

---

## Phase 8: Production Deployment

1. Create production Polar account
2. Update env vars to production
3. Configure production webhooks
4. Deploy: `vercel --prod`
5. Test with real payment

---

## Quick Start

```bash
npm install @polar-sh/sdk
npx convex dev
npm run dev
```

---

## Estimated Time: 6-8 hours
