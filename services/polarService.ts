// Polar.sh service for subscription management
import { Polar } from '@polar-sh/sdk'

const polar = new Polar({
  server: 'sandbox',
  accessToken: process.env['POLAR_ACCESS_TOKEN'] ?? '',
})

export interface CheckoutSession {
  id: string
  url: string
  customerEmail?: string
  customerId?: string
}

export interface Subscription {
  id: string
  status: 'active' | 'canceled' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  productId: string
  priceId: string
}

export const polarService = {
  // Get Polar client instance
  getClient: () => polar,

  // Placeholder functions - will be implemented with correct API once Polar docs are clarified
  createCheckoutSession: async (priceId: string, userEmail: string): Promise<CheckoutSession> => {
    // TODO: Implement with correct Polar API
    throw new Error('Not implemented yet')
  },

  getSubscription: async (subscriptionId: string): Promise<Subscription> => {
    // TODO: Implement with correct Polar API
    throw new Error('Not implemented yet')
  },

  listCustomerSubscriptions: async (customerId: string): Promise<Subscription[]> => {
    // TODO: Implement with correct Polar API
    throw new Error('Not implemented yet')
  },

  cancelSubscription: async (subscriptionId: string): Promise<void> => {
    // TODO: Implement with correct Polar API
    throw new Error('Not implemented yet')
  },

  reactivateSubscription: async (subscriptionId: string): Promise<void> => {
    // TODO: Implement with correct Polar API
    throw new Error('Not implemented yet')
  },
}

export default polarService