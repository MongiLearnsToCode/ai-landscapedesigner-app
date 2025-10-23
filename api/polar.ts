import { polar } from '../src/lib/polar';
import { db } from '../db/client';
import { polarUsers, subscriptions, webhookEvents } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  fullName?: string;
  firstName?: string;
}

// Get or create Polar customer for Clerk user
export async function getOrCreatePolarCustomer(clerkUser: ClerkUser) {
  try {
    // Check if user already exists in our database
    const existingUser = await db
      .select()
      .from(polarUsers)
      .where(eq(polarUsers.clerkUserId, clerkUser.id))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].polarCustomerId) {
      // User exists and has Polar customer ID, fetch from Polar
      try {
        const customer = await polar.customers.get({ id: existingUser[0].polarCustomerId });
        return customer;
      } catch (error) {
        console.error('Failed to fetch existing Polar customer:', error);
        // Customer might not exist in Polar, create new one
      }
    }

    // Create new Polar customer
    const customer = await polar.customers.create({
      email: clerkUser.emailAddresses[0].emailAddress,
      name: clerkUser.fullName || clerkUser.firstName || 'User',
      metadata: {
        clerk_user_id: clerkUser.id,
      },
    });

    // Store in our database
    if (existingUser.length > 0) {
      // Update existing user
      await db
        .update(polarUsers)
        .set({ polarCustomerId: customer.id })
        .where(eq(polarUsers.clerkUserId, clerkUser.id));
    } else {
      // Create new user record
      await db.insert(polarUsers).values({
        clerkUserId: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        polarCustomerId: customer.id,
      });
    }

    return customer;
  } catch (error) {
    console.error('Error in getOrCreatePolarCustomer:', error);
    throw error;
  }
}

// Get Polar customer by Clerk user ID
export async function getPolarCustomer(clerkUserId: string) {
  try {
    const user = await db
      .select()
      .from(polarUsers)
      .where(eq(polarUsers.clerkUserId, clerkUserId))
      .limit(1);

    if (user.length === 0 || !user[0].polarCustomerId) {
      return null;
    }

    return await polar.customers.get({ id: user[0].polarCustomerId });
  } catch (error) {
    console.error('Error getting Polar customer:', error);
    return null;
  }
}

// Check if user has active subscription
export async function requireActiveSubscription(clerkUserId: string) {
  try {
    const user = await db
      .select()
      .from(polarUsers)
      .where(eq(polarUsers.clerkUserId, clerkUserId))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id))
      .limit(1);

    if (subscription.length === 0 || subscription[0].status !== 'active') {
      throw new Error('Active subscription required');
    }

    // Additional check: verify not past period end if canceled
    if (subscription[0].cancelAtPeriodEnd && subscription[0].currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(subscription[0].currentPeriodEnd);
      if (now > periodEnd) {
        throw new Error('Subscription expired');
      }
    }

    return subscription[0];
  } catch (error) {
    console.error('Error checking subscription:', error);
    throw error;
  }
}

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