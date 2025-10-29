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