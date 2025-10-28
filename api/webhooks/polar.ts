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
    subscriptionPriceId: subscription.prices?.[0]?.id || null, // Get first price ID
    status: 'active',
    plan: planConfig.plan,
    limit: planConfig.limit,
    currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : null,
  });
}

async function handleSubscriptionCanceled(subscription: any) {
  const customerId = subscription.customerId;

  await convex.mutation(api.users.updateSubscription, {
    polarCustomerId: customerId,
    subscriptionId: subscription.id,
    subscriptionPriceId: subscription.prices?.[0]?.id || null, // Get first price ID
    status: 'canceled',
    plan: 'Free',
    limit: 3,
    currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : null,
  });
}

async function handleOrderCreated(order: any) {
  // Link Polar customer to Clerk user if metadata exists
  if (order.customer?.metadata?.clerk_user_id) {
    await convex.mutation(api.users.linkPolarCustomer, {
      clerkUserId: order.customer.metadata.clerk_user_id,
      polarCustomerId: order.customerId,
    });
  }
}