import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get current user profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(userId);
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Get user by Polar customer ID
export const getUserByPolarCustomer = query({
  args: { polarCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_polar_customer", (q) => q.eq("polarCustomerId", args.polarCustomerId))
      .unique();
  },
});

// Ensure user exists (called after sign up)
export const ensureUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check if user already exists
    const existingUser = await ctx.db.get(userId);
    if (existingUser) {
      const patch: Record<string, string | number | undefined> = {};

      if (existingUser.email !== args.email) {
        patch.email = args.email;
      }
      if (args.name && existingUser.name !== args.name) {
        patch.name = args.name;
      }
      if (existingUser.subscriptionStatus === undefined) {
        patch.subscriptionStatus = "active";
      }
      if (existingUser.subscriptionPlan === undefined) {
        patch.subscriptionPlan = "Free";
      }
      if (existingUser.monthlyRedesignLimit === undefined) {
        patch.monthlyRedesignLimit = 3;
      }
      if (existingUser.redesignsUsedThisMonth === undefined) {
        patch.redesignsUsedThisMonth = 0;
      }
      if (existingUser.currentMonthStart === undefined) {
        patch.currentMonthStart = Date.now();
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(userId, {
          ...patch,
        });
      }
      return existingUser._id;
    }

    // Create new user document
    const newUserId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      subscriptionStatus: "active",
      subscriptionPlan: "Free",
      monthlyRedesignLimit: 3,
      redesignsUsedThisMonth: 0,
      currentMonthStart: Date.now(),
    });

    return newUserId;
  },
});

// Link Polar customer ID to a Convex Auth user
export const linkPolarCustomer = mutation({
  args: {
    userId: v.id("users"),
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      polarCustomerId: args.polarCustomerId,
    });
  },
});

// Update subscription from Polar webhook
export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    polarCustomerId: v.optional(v.string()),
    status: v.string(),
    plan: v.string(),
    billingCycle: v.optional(v.string()),
    limit: v.number(),
    currentPeriodEnd: v.optional(v.number()),
    subscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      console.error("User not found for subscription update:", args.userId);
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      polarCustomerId: args.polarCustomerId ?? user.polarCustomerId,
      subscriptionStatus: args.status,
      subscriptionPlan: args.plan,
      billingCycle: args.billingCycle,
      monthlyRedesignLimit: args.limit,
      currentPeriodEnd: args.currentPeriodEnd,
      expirationDate: args.currentPeriodEnd,
      subscriptionId: args.subscriptionId,
    });
  },
});

// Initialize user defaults
export const initializeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (user.subscriptionPlan === undefined) {
      await ctx.db.patch(userId, {
        subscriptionStatus: "active",
        subscriptionPlan: "Free",
        monthlyRedesignLimit: 3,
        redesignsUsedThisMonth: 0,
        currentMonthStart: Date.now(),
      });
    }
  },
});
