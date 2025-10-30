import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';

// Plan limits mapping
const PLAN_LIMITS: Record<string, { plan: string; limit: number }> = {
  Personal: { plan: 'Personal', limit: 50 },
  Creator: { plan: 'Creator', limit: 200 },
  Business: { plan: 'Business', limit: 999999 },
};

// Helper function to extract billing cycle from subscription price data
function extractBillingCycle(subscription: any): { billingCycle: string | null; priceId: string | null } {
  const price = subscription.prices?.[0];

  if (!price) {
    console.warn(`⚠️  Missing price data for subscription ${subscription.id}, customer ${subscription.customerId}`);
    return { billingCycle: null, priceId: null };
  }

  const cadence = price.recurringInterval ?? price.recurring_interval;
  const billingCycle = (cadence === 'year') ? 'annual' : 'monthly';
  return { billingCycle, priceId: price.id };
}

export const polarWebhook = httpAction(async (ctx, request) => {
  // Convert Headers to plain object for logging and validation
  const headersObj: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  console.log("Polar webhook received:", {
    url: request.url,
    method: request.method,
    headers: headersObj,
  });

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET!;
    if (!webhookSecret) {
      console.error("POLAR_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Read request body
    const body = await request.text();
    let event;
    
    try {
      // Verify webhook signature using SDK method
      event = validateEvent(
        body,
        headersObj,
        webhookSecret
      );
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        console.error('Webhook verification failed:', err);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    console.log('Polar webhook event received:', event.type);

    // Type assertion to access event properties safely
    const webhookEvent = event as any;
    
    // Check if already processed (idempotency)
    const logResult = await ctx.runMutation(api.webhooks.logWebhookEvent, {
      eventId: webhookEvent.id,
      eventType: webhookEvent.type,
      payload: webhookEvent,
    });

    if (logResult.alreadyProcessed) {
      console.log('Event already processed:', webhookEvent.id);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle different event types
    switch (webhookEvent.type) {
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
        await handleSubscriptionActive(ctx, webhookEvent.data);
        break;

      case 'subscription.canceled':
      case 'subscription.revoked':
        await handleSubscriptionCanceled(ctx, webhookEvent.data);
        break;

      case 'order.created':
        await handleOrderCreated(ctx, webhookEvent.data);
        break;

      default:
        console.log('Unhandled event type:', webhookEvent.type);
    }

    // Mark as processed
    await ctx.runMutation(api.webhooks.markWebhookProcessed, {
      eventId: webhookEvent.id,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function handleSubscriptionActive(ctx: any, subscription: any) {
  const customerId = subscription.customerId;
  const productName = subscription.product.name;
  const planConfig = PLAN_LIMITS[productName] || { plan: 'Free', limit: 3 };

  // Extract billing cycle and price ID with proper error handling
  const { billingCycle, priceId } = extractBillingCycle(subscription);

  await ctx.runMutation(api.users.updateSubscription, {
    polarCustomerId: customerId,
    subscriptionId: subscription.id,
    subscriptionPriceId: priceId,
    status: 'active',
    plan: planConfig.plan,
    billingCycle,
    limit: planConfig.limit,
    currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : null,
  });
}

async function handleSubscriptionCanceled(ctx: any, subscription: any) {
  const customerId = subscription.customerId;

  // For canceled subscriptions, we keep the billing cycle info for reference
  const { billingCycle, priceId } = extractBillingCycle(subscription);

  await ctx.runMutation(api.users.updateSubscription, {
    polarCustomerId: customerId,
    subscriptionId: subscription.id,
    subscriptionPriceId: priceId,
    status: 'canceled',
    plan: 'Free',
    billingCycle,
    limit: 3,
    currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : null,
  });
}

async function handleOrderCreated(ctx: any, order: any) {
  // Link Polar customer to Clerk user if metadata exists
  if (order.customer?.metadata?.clerk_user_id) {
    await ctx.runMutation(api.users.linkPolarCustomer, {
      clerkUserId: order.customer.metadata.clerk_user_id,
      polarCustomerId: order.customerId,
    });
  }
}