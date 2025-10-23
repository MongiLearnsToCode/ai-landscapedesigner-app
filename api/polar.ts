import { ClerkUser } from '../types';
import {
  getOrCreatePolarCustomer as _getOrCreatePolarCustomer,
  getPolarCustomer as _getPolarCustomer,
  requireActiveSubscription as _requireActiveSubscription
} from '../services/polarService';

// Re-export functions from services/polarService.ts
export const getOrCreatePolarCustomer = _getOrCreatePolarCustomer;
export const getPolarCustomer = _getPolarCustomer;
export const requireActiveSubscription = _requireActiveSubscription;

// Fetch products from Polar
export async function getPolarProducts() {
  try {
    // For now, use environment-based configuration since the Polar SDK types are unclear
    // TODO: Fix Polar SDK product fetching when types are better understood
    return [
      {
        id: process.env.POLAR_PERSONAL_PRODUCT_ID || 'prod_personal',
        name: 'Personal',
        description: 'For casual users or hobbyists.',
        prices: [
          {
            id: process.env.VITE_POLAR_PRICE_PERSONAL_MONTHLY || 'price_monthly_personal',
            amount: 1200,
            currency: 'USD',
            interval: 'month'
          },
          {
            id: process.env.VITE_POLAR_PRICE_PERSONAL_ANNUAL || 'price_yearly_personal',
            amount: 12000,
            currency: 'USD',
            interval: 'year'
          }
        ]
      },
      {
        id: process.env.POLAR_CREATOR_PRODUCT_ID || 'prod_creator',
        name: 'Creator',
        description: 'For regular creators & freelancers.',
        prices: [
          {
            id: process.env.VITE_POLAR_PRICE_CREATOR_MONTHLY || 'price_monthly_creator',
            amount: 2900,
            currency: 'USD',
            interval: 'month'
          },
          {
            id: process.env.VITE_POLAR_PRICE_CREATOR_ANNUAL || 'price_yearly_creator',
            amount: 24000,
            currency: 'USD',
            interval: 'year'
          }
        ]
      },
      {
        id: process.env.POLAR_BUSINESS_PRODUCT_ID || 'prod_business',
        name: 'Business',
        description: 'For teams, agencies & power users.',
        prices: [
          {
            id: process.env.VITE_POLAR_PRICE_BUSINESS_MONTHLY || 'price_monthly_business',
            amount: 6000,
            currency: 'USD',
            interval: 'month'
          },
          {
            id: process.env.VITE_POLAR_PRICE_BUSINESS_ANNUAL || 'price_yearly_business',
            amount: 48000,
            currency: 'USD',
            interval: 'year'
          }
        ]
      }
    ];
  } catch (error) {
    console.error('Error fetching Polar products:', error);
    throw error;
  }
}

// Re-export the ClerkUser type
export type { ClerkUser };