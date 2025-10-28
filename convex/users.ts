import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    subscriptionPriceId: v.string(),
    status: v.string(),
    plan: v.string(),
    limit: v.number(),
    currentPeriodEnd: v.number(),
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