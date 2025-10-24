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
      // TODO: Implement with correct Polar checkout API once documentation is available
      // For now, return a placeholder that will be replaced with actual implementation
      throw new Error('Polar checkout API implementation pending - requires API documentation clarification');
    } catch (error) {
      console.error('Error creating Polar checkout session:', error);
      throw error;
    }
  },

  // Get subscription details
  getSubscription: async (subscriptionId: string): Promise<Subscription> => {
    try {
      // TODO: Implement with correct Polar subscription API once documentation is available
      throw new Error('Polar subscription API implementation pending - requires API documentation clarification');
    } catch (error) {
      console.error('Error getting Polar subscription:', error);
      throw error;
    }
  },

  // List subscriptions for a customer
  listCustomerSubscriptions: async (customerId: string): Promise<Subscription[]> => {
    try {
      // TODO: Implement with correct Polar subscription list API once documentation is available
      throw new Error('Polar subscription list API implementation pending - requires API documentation clarification');
    } catch (error) {
      console.error('Error listing customer subscriptions:', error);
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId: string): Promise<void> => {
    try {
      await polar.subscriptions.update({
        id: subscriptionId,
        subscriptionUpdate: { cancelAtPeriodEnd: true }
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
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