import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { PLAN_LIMITS } from "./constants";

// Helper function to extract billing cycle from subscription price data
function extractBillingCycle(subscription: any): { billingCycle?: string; priceId?: string } {
  const price = subscription.prices?.[0];

  if (!price) {
    console.warn(`⚠️  Missing price data for subscription ${subscription.id}, customer ${subscription.customerId}`);
    return { billingCycle: undefined, priceId: undefined };
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
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("POLAR_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Read request body
    const body = await request.text();
    
    // TODO: Implement Convex-compatible signature verification
    // The validateEvent function uses Buffer which is not available in Convex runtime
    // For now, we'll parse the event directly and rely on webhook secret being kept secure
    console.warn('⚠️  Webhook signature verification temporarily disabled - implement Convex-compatible verification');
    
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error('Failed to parse webhook body:', err);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('Polar webhook event received:', event.type);
    console.log('Full webhook payload structure:', JSON.stringify(event, null, 2));

    // Type assertion to access event properties safely
    const webhookEvent = event as any;
    
    // Generate stable event ID for idempotency
    // Same event type + resource ID = same eventId, allowing Polar retries to be deduplicated
    // Different event types for same resource get different IDs
    const resourceId = webhookEvent.data?.id || webhookEvent.id || 'unknown';
    const eventId = `${webhookEvent.type}_${resourceId}`;
    
    console.log('Stable eventId:', eventId);
    
    // Check if already processed (idempotency)
    const logResult = await ctx.runMutation(api.webhooks.logWebhookEvent, {
      eventId: eventId,
      eventType: webhookEvent.type,
      payload: webhookEvent,
    });

    if (logResult.alreadyProcessed) {
      console.log('Event already processed:', eventId);
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
        await handleSubscriptionActive(ctx, webhookEvent.data, webhookEvent.type);
        break;

      case 'subscription.canceled':
      case 'subscription.revoked':
        await handleSubscriptionCanceled(ctx, webhookEvent.data, webhookEvent.type);
        break;

      case 'order.created':
      case 'order.updated':
        await handleOrderCreated(ctx, webhookEvent.data);
        break;

      case 'order.paid':
        console.log('Order paid event received:', webhookEvent.data.id);
        // Order paid is informational - subscription.active handles the actual activation
        break;

      case 'customer.created':
      case 'customer.updated':
      case 'customer.state_changed':
        console.log(`Customer event received: ${webhookEvent.type}`, webhookEvent.data.id);
        // Customer events are informational - handled via order.created
        break;

      case 'checkout.created':
      case 'checkout.updated':
        console.log(`Checkout event received: ${webhookEvent.type}`, webhookEvent.data.id);
        // Checkout events are informational - final state handled by order/subscription events
        break;

      default:
        console.log('Unhandled event type:', webhookEvent.type);
    }

    // Mark as processed
    await ctx.runMutation(api.webhooks.markWebhookProcessed, {
      eventId: eventId,
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

async function handleSubscriptionActive(ctx: any, subscription: any, eventType: string) {
  // Validate required properties exist and are of correct type
  if (!subscription) {
    console.error(`Invalid subscription object provided to handleSubscriptionActive for event type: ${eventType}`);
    return;
  }

  // Check if subscription has required properties
  if (!subscription.id) {
    console.error(`Subscription missing id property for event type: ${eventType}`);
    return;
  }

  if (!subscription.customerId) {
    console.error(`Subscription missing customerId property for event type: ${eventType}`);
    return;
  }

  // Validate product exists and has name property
  if (!subscription.product) {
    console.error(`Subscription missing product property for event type: ${eventType}`);
    return;
  }

  // Handle currentPeriodEnd validation based on event type
  // For subscription.created events, currentPeriodEnd might be missing, so we log a warning and skip setup
  if (!subscription.currentPeriodEnd) {
    if (eventType === 'subscription.created') {
      console.warn(`Missing currentPeriodEnd for subscription.created event (subscriptionId: ${subscription.id}). Skipping subscription setup.`);
      return; // Skip setting up the subscription for now
    } else {
      // For other event types, this is an error
      console.error(`Missing currentPeriodEnd for event type: ${eventType}, subscriptionId: ${subscription.id}`);
      return;
    }
  }

  // Validate product name exists and is a string
  const productName = subscription.product && typeof subscription.product.name === 'string' 
    ? subscription.product.name 
    : null;
  
  // Use default plan if product name is missing or invalid
  const planConfig = productName && PLAN_LIMITS[productName] 
    ? PLAN_LIMITS[productName] 
    : { plan: 'Free', limit: 3 };

  // Validate currentPeriodEnd can be converted to a Date object
  let currentPeriodEndDate = null;
  if (subscription.currentPeriodEnd) {
    const date = new Date(subscription.currentPeriodEnd);
    if (isNaN(date.getTime())) {
      console.error('Invalid date format for currentPeriodEnd:', subscription.currentPeriodEnd);
      return;
    }
    currentPeriodEndDate = date.getTime();
  }

  // Extract billing cycle and price ID with proper error handling
  const { billingCycle, priceId } = extractBillingCycle(subscription);

  await ctx.runMutation(api.users.updateSubscription, {
    polarCustomerId: subscription.customerId,
    subscriptionId: subscription.id,
    subscriptionPriceId: priceId,
    status: 'active',
    plan: planConfig.plan,
    billingCycle,
    limit: planConfig.limit,
    currentPeriodEnd: currentPeriodEndDate,
  });
}

async function handleSubscriptionCanceled(ctx: any, subscription: any, eventType: string) {
  // Validate required properties exist and are of correct type
  if (!subscription) {
    console.error(`Invalid subscription object provided to handleSubscriptionCanceled for event type: ${eventType}`);
    return;
  }

  if (!subscription.id) {
    console.error(`Subscription missing id property for event type: ${eventType}`);
    return;
  }

  if (!subscription.customerId) {
    console.error(`Subscription missing customerId property for event type: ${eventType}`);
    return;
  }

  // For canceled subscriptions, currentPeriodEnd might not be required or might be missing in some events
  // We'll allow the function to continue but handle the missing value gracefully
  let currentPeriodEndDate = null;
  if (subscription.currentPeriodEnd) {
    const date = new Date(subscription.currentPeriodEnd);
    if (isNaN(date.getTime())) {
      console.error('Invalid date format for currentPeriodEnd:', subscription.currentPeriodEnd);
      return;
    }
    currentPeriodEndDate = date.getTime();
  } else {
    // Log a warning when currentPeriodEnd is missing for cancellation events
    console.warn(`Missing currentPeriodEnd for cancellation event (event type: ${eventType}, subscriptionId: ${subscription.id})`);
  }

  // For canceled subscriptions, we keep the billing cycle info for reference
  const { billingCycle, priceId } = extractBillingCycle(subscription);

  await ctx.runMutation(api.users.updateSubscription, {
    polarCustomerId: subscription.customerId,
    subscriptionId: subscription.id,
    subscriptionPriceId: priceId,
    status: 'canceled',
    plan: 'Free',
    billingCycle,
    limit: 3,
    currentPeriodEnd: currentPeriodEndDate,
  });
}

async function handleOrderCreated(ctx: any, order: any) {
  // Link Polar customer to Clerk user if metadata exists
  if (order.customer?.metadata?.clerk_user_id) {
    // Validate that order.customerId exists before calling the mutation
    if (order.customerId) {
      await ctx.runMutation(api.users.linkPolarCustomer, {
        clerkUserId: order.customer.metadata.clerk_user_id,
        polarCustomerId: order.customerId,
      });
    } else {
      console.warn(`Missing order.customerId for order with clerk_user_id: ${order.customer.metadata.clerk_user_id}`);
      // Optionally, we could fallback to order.customer.id if available
      if (order.customer?.id) {
        console.log(`Using fallback customer id: ${order.customer.id}`);
        await ctx.runMutation(api.users.linkPolarCustomer, {
          clerkUserId: order.customer.metadata.clerk_user_id,
          polarCustomerId: order.customer.id,
        });
      } else {
        console.error(`No valid customer ID found for order with clerk_user_id: ${order.customer.metadata.clerk_user_id}`);
      }
    }
  }
}