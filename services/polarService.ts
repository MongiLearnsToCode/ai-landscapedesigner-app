import { getPolar } from '../src/lib/polar';
import { db } from '../db/client';
import { polarUsers, subscriptions } from '../db/schema';
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
    const polar = getPolar();
    return await db.transaction(async (tx) => {
      const existing = await tx.select().from(polarUsers)
        .where(eq(polarUsers.clerkUserId, clerkUser.id)).limit(1);

      if (existing.length > 0 && existing[0].polarCustomerId) {
        return await polar.customers.get({ id: existing[0].polarCustomerId });
      }

      const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
      if (!primaryEmail) throw new Error('No email found for Clerk user');
      const customer = await polar.customers.create({
        email: primaryEmail,
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        metadata: { clerk_user_id: clerkUser.id },
      });

      await tx.insert(polarUsers).values({
        clerkUserId: clerkUser.id,
        email: primaryEmail,
        polarCustomerId: customer.id,
      }).onConflictDoUpdate({
        target: polarUsers.clerkUserId,
        set: { polarCustomerId: customer.id },
      });

      return customer;
    });
  } catch (error) {
    console.error('Error in getOrCreatePolarCustomer:', error);
    throw error;
  }
}

// Get Polar customer by Clerk user ID
export async function getPolarCustomer(clerkUserId: string) {
  try {
    const polar = getPolar();
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

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id))
      .limit(10);

    // If multiple, choose one with status 'active' and latest currentPeriodEnd
    const sub = (Array.isArray(subscription) ? subscription : [subscription])
      .filter(s => s?.status === 'active')
      .sort((a, b) => new Date(b.currentPeriodEnd ?? 0).getTime() - new Date(a.currentPeriodEnd ?? 0).getTime())[0];

    if (!sub) {
      throw new Error('Active subscription required');
    }

    if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(sub.currentPeriodEnd);
      if (now > periodEnd) {
        throw new Error('Subscription expired');
      }
    }

    return sub;
  } catch (error) {
    console.error('Error checking subscription:', error);
    throw error;
  }
}