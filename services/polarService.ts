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
  createCheckoutSession: async (priceId: string, userEmail: string, successUrl?: string, cancelUrl?: string): Promise<CheckoutSession> => {
    try {
      const session = await polar.checkouts.create({
        products: [priceId],
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
        priceId: subscription.prices?.[0]?.id || '',
      };
    } catch (error) {
      console.error('Error getting Polar subscription:', error);
      throw error;
    }
  },

  // List subscriptions for a customer
  listCustomerSubscriptions: async (customerId: string): Promise<Subscription[]> => {
    try {
      // For now, return empty array until we can clarify the correct API usage
      // The sync functionality will work with webhooks instead
      console.log(`Listing subscriptions for customer ${customerId} - implementation pending API clarification`);
      return [];
    } catch (error) {
      console.error('Error listing customer subscriptions:', error);
      throw error;
    }
   },

  // Reactivate subscription
  reactivateSubscription: async (subscriptionId: string): Promise<void> => {
    try {
      await polar.subscriptions.update({
        id: subscriptionId,
        subscriptionUpdate: { cancelAtPeriodEnd: false }
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
   },
 }

 export default polarService