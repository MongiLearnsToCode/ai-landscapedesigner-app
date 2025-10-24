// Polar.sh service for subscription management
import { Polar } from '@polar-sh/sdk'

// Environment validation
const accessToken = process.env['POLAR_ACCESS_TOKEN'];
const server = process.env['POLAR_SERVER'] || 'sandbox';

if (!accessToken) {
  throw new Error('POLAR_ACCESS_TOKEN environment variable is required');
}

if (!['sandbox', 'production'].includes(server)) {
  throw new Error('POLAR_SERVER must be either "sandbox" or "production"');
}

const polar = new Polar({
  server: server as 'sandbox' | 'production',
  accessToken,
})

console.log(`Polar service initialized with server: ${server}`);

// Helper function to select the active price from a subscription
function selectActivePrice(prices: any[]): string {
  if (!prices || prices.length === 0) return '';

  // Filter out archived prices
  const activePrices = prices.filter(price => !price.is_archived);

  if (activePrices.length === 0) return '';

  // If multiple active prices, prefer monthly billing cycle
  if (activePrices.length > 1) {
    const monthlyPrice = activePrices.find(price =>
      price.recurring_interval === 'month' && price.currency === 'usd'
    );
    if (monthlyPrice) return monthlyPrice.id;
  }

  // Return the first active price
  return activePrices[0].id;
}

export interface CheckoutSession {
  id: string
  url: string
  customerEmail?: string
  customerId?: string
}

export interface Subscription {
  id: string
  status: 'active' | 'canceled' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  productId: string
  priceId: string
}

export const polarService = {
  // Get Polar client instance
  getClient: () => polar,

  // Create a checkout session for subscription
  createCheckoutSession: async (productId: string, userEmail: string, successUrl?: string): Promise<CheckoutSession> => {
    try {
      // Assuming productId is the product ID
      const session = await polar.checkouts.create({
        products: [productId],
        successUrl: successUrl || process.env['POLAR_SUCCESS_URL'],
        customerEmail: userEmail,
      });

      return {
        id: session.id,
        url: session.url,
        customerEmail: session.customerEmail,
        customerId: session.customerId,
      };
    } catch (error) {
      console.error('Error creating Polar checkout session:', error);
      throw error;
    }
  },

  // Get subscription details
  getSubscription: async (subscriptionId: string): Promise<Subscription> => {
    try {
      const subscription = await polar.subscriptions.get({ id: subscriptionId });

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        productId: subscription.productId,
        priceId: selectActivePrice(subscription.prices),
      };
    } catch (error) {
      console.error('Error getting Polar subscription:', error);
      throw error;
    }
  },

  // List subscriptions for a customer
  listCustomerSubscriptions: async (customerId: string): Promise<Subscription[]> => {
    try {
      const result = await polar.subscriptions.list({ customerId });
      const subscriptions: Subscription[] = [];

      // Try to iterate over the result
      try {
        for await (const page of result) {
          if (page && Array.isArray(page)) {
            for (const sub of page) {
            subscriptions.push({
              id: sub.id,
              status: sub.status,
              currentPeriodStart: sub.currentPeriodStart.toISOString(),
              currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
              productId: sub.productId,
              priceId: selectActivePrice(sub.prices),
            });
            }
          }
        }
      } catch (iterError) {
        // If iteration fails, try accessing as direct array
        console.warn('Iterator approach failed, trying direct access:', iterError.message);
        if (Array.isArray(result)) {
          for (const sub of result) {
            subscriptions.push({
              id: sub.id,
              status: sub.status,
              currentPeriodStart: sub.currentPeriodStart.toISOString(),
              currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
              productId: sub.productId,
              priceId: selectActivePrice(sub.prices),
            });
          }
        }
      }

      return subscriptions;
    } catch (error) {
      console.error('Error listing customer subscriptions:', error);
      throw error;
    }
  },

  // Reactivate subscription
  reactivateSubscription: async (subscriptionId: string): Promise<void> => {
    try {
      // First, get the current subscription status
      const subscription = await polar.subscriptions.get({ id: subscriptionId });

      if (subscription.status === 'canceled') {
        // For already canceled subscriptions, we need to create a new subscription
        // This typically requires the original product/price information
        // For now, we'll throw an error indicating this needs manual handling
        throw new Error('Cannot reactivate a fully canceled subscription. Please create a new subscription.');
      } else if (subscription.cancelAtPeriodEnd) {
        // If scheduled for cancellation, prevent the cancellation
        await polar.subscriptions.update({
          id: subscriptionId,
          subscriptionUpdate: { cancelAtPeriodEnd: false }
        });
      } else {
        // Subscription is already active
        console.log(`Subscription ${subscriptionId} is already active`);
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  },
 }

 export default polarService