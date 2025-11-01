import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Polar } from "@polar-sh/sdk";

// Ensure user exists and get/create user
export const ensureUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create new user with free tier defaults
    return await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      email: args.email,
      name: args.name,
      subscriptionStatus: "active",
      subscriptionPlan: "Free",
      monthlyRedesignLimit: 3,
      redesignsUsedThisMonth: 0,
      currentMonthStart: Date.now(),
    });
  },
});

// Get user profile
export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    return user;
  },
});

// Update subscription from webhook
export const updateSubscription = mutation({
  args: {
    polarCustomerId: v.string(),
    subscriptionId: v.string(),
    subscriptionPriceId: v.optional(v.string()),
    status: v.string(),
    plan: v.string(),
    billingCycle: v.optional(v.string()),
    limit: v.number(),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_polar_customer", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found for customer ID");
    }

    await ctx.db.patch(user._id, {
      subscriptionId: args.subscriptionId,
      subscriptionPriceId: args.subscriptionPriceId,
      subscriptionStatus: args.status,
      subscriptionPlan: args.plan,
      billingCycle: args.billingCycle,
      monthlyRedesignLimit: args.limit,
      currentPeriodEnd: args.currentPeriodEnd,
    });
  },
});

// Link Polar customer ID
export const linkPolarCustomer = mutation({
  args: {
    clerkUserId: v.string(),
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      polarCustomerId: args.polarCustomerId,
    });
  },
});

// Initialize Polar client
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
});

// Get customer portal URL (for managing subscription externally)
export const getCustomerPortalUrl = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || !user.polarCustomerId) {
      return null;
    }

    try {
      const session = await polar.customerSessions.create({
        customerId: user.polarCustomerId,
      });

      return session.customerPortalUrl;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      return null;
    }
  },
});

// Sync subscription from Polar API (for manual refresh)
export const syncSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || !user.polarCustomerId) {
      throw new Error("No Polar customer linked to this user");
    }

    try {
      // Fetch subscriptions for this customer
      const subscriptionsResponse = await polar.subscriptions.list({
        customerId: user.polarCustomerId,
        active: true,
      });

      console.log('Fetched subscriptions for customer:', user.polarCustomerId, subscriptionsResponse);

      // Handle response - could be array or object with items/data property
      const subscriptionsList = (subscriptionsResponse as any).items || (subscriptionsResponse as any).data || (subscriptionsResponse as any).result || [];
      
      if (!Array.isArray(subscriptionsList) || subscriptionsList.length === 0) {
        console.log('No active subscriptions found for customer:', user.polarCustomerId);
        return { success: false, message: 'No active subscription found' };
      }

      // Get the first active subscription
      const subscription = subscriptionsList[0];
      
      // Plan limits mapping
      const PLAN_LIMITS_SYNC: Record<string, { plan: string; limit: number }> = {
        Personal: { plan: 'Personal', limit: 50 },
        Creator: { plan: 'Creator', limit: 200 },
        Business: { plan: 'Business', limit: 999999 },
      };
      
      const productName = subscription.product?.name || 'Free';
      const planConfig = PLAN_LIMITS_SYNC[productName] || { plan: 'Free', limit: 3 };
      
      // Extract billing cycle
      const price = subscription.price;
      const cadence = price?.recurringInterval || price?.recurring_interval;
      const billingCycle = cadence === 'year' ? 'annual' : 'monthly';
      
      // Update user subscription
      await ctx.db.patch(user._id, {
        subscriptionId: subscription.id,
        subscriptionPriceId: price?.id,
        subscriptionStatus: subscription.status,
        subscriptionPlan: planConfig.plan,
        billingCycle,
        monthlyRedesignLimit: planConfig.limit,
        currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : undefined,
      });

      console.log('Successfully synced subscription for user:', identity.subject);
      return { success: true, plan: planConfig.plan };
    } catch (error) {
      console.error('Error syncing subscription:', error);
      throw new Error('Failed to sync subscription from Polar');
    }
  },
});

// Cancel subscription
export const cancelSubscription = mutation({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || !user.subscriptionId) {
      throw new Error("No active subscription found");
    }

    try {
      // For now, we'll use the customer portal for cancellation
      // This is a simplified implementation - in production you'd call the Polar API directly
      console.log('Cancel subscription requested for user:', identity.subject, 'subscription:', user.subscriptionId);
      // The webhook will handle updating the database when the user cancels via portal
      return { success: true, usePortal: true };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  },
});