import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to reset monthly counter if needed
const checkAndResetMonthlyUsage = async (ctx: any, user: any) => {
  const now = Date.now();
  const monthStart = user.currentMonthStart || now;
  const daysSinceStart = (now - monthStart) / (1000 * 60 * 60 * 24);

  if (daysSinceStart >= 30) {
    await ctx.db.patch(user._id, {
      redesignsUsedThisMonth: 0,
      currentMonthStart: now,
    });
    return { ...user, redesignsUsedThisMonth: 0, currentMonthStart: now };
  }

  return user;
};

// Get history
export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("redesigns")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .order("desc")
      .collect();
  },
});

// Check limit with subscription awareness
export const checkLimit = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        used: 0,
        limit: 3,
        remaining: 0,
        hasReachedLimit: true,
        isAuthenticated: false,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      return {
        used: 0,
        limit: 3,
        remaining: 3,
        hasReachedLimit: false,
        isAuthenticated: true,
      };
    }

    // Check if we need to reset monthly counter
    const now = Date.now();
    const monthStart = user.currentMonthStart || now;
    const daysSinceStart = (now - monthStart) / (1000 * 60 * 60 * 24);
    const shouldReset = daysSinceStart >= 30;

    const used = shouldReset ? 0 : (user.redesignsUsedThisMonth || 0);
    const limit = user.monthlyRedesignLimit || 3;
    const isUnlimited = user.subscriptionPlan === "Business";

    return {
      used,
      limit: isUnlimited ? 999999 : limit,
      remaining: isUnlimited ? 999999 : Math.max(0, limit - used),
      hasReachedLimit: isUnlimited ? false : used >= limit,
      isAuthenticated: true,
      plan: user.subscriptionPlan || "Free",
      isUnlimited,
    };
  },
});

// Save redesign with usage tracking
export const saveRedesign = mutation({
  args: {
    redesignId: v.string(),
    originalImageUrl: v.string(),
    redesignedImageUrl: v.string(),
    designCatalog: v.any(),
    styles: v.any(),
    climateZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check and reset monthly usage if needed
    const updatedUser = await checkAndResetMonthlyUsage(ctx, user);

    // Check if limit reached (unless unlimited)
    const isUnlimited = updatedUser.subscriptionPlan === "Business";
    if (!isUnlimited) {
      const used = updatedUser.redesignsUsedThisMonth || 0;
      const limit = updatedUser.monthlyRedesignLimit || 3;
      if (used >= limit) {
        throw new Error("Monthly redesign limit reached");
      }
    }

    // Save redesign
    const id = await ctx.db.insert("redesigns", {
      ...args,
      clerkUserId: identity.subject,
      isPinned: false,
      createdAt: Date.now(),
    });

    // Increment usage counter
    if (!isUnlimited) {
      await ctx.db.patch(updatedUser._id, {
        redesignsUsedThisMonth: (updatedUser.redesignsUsedThisMonth || 0) + 1,
      });
    }

    return id;
  },
});

// Toggle pin
export const togglePin = mutation({
  args: { redesignId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const redesign = await ctx.db
      .query("redesigns")
      .withIndex("by_redesign_id", (q) => q.eq("redesignId", args.redesignId))
      .unique();

    if (!redesign) throw new Error("Not found");
    if (redesign.clerkUserId !== identity.subject)
      throw new Error("Not authorized");

    await ctx.db.patch(redesign._id, {
      isPinned: !redesign.isPinned,
    });
  },
});

// Delete redesign
export const deleteRedesign = mutation({
  args: { redesignId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const redesign = await ctx.db
      .query("redesigns")
      .withIndex("by_redesign_id", (q) => q.eq("redesignId", args.redesignId))
      .unique();

    if (!redesign) throw new Error("Not found");
    if (redesign.clerkUserId !== identity.subject)
      throw new Error("Not authorized");

    await ctx.db.delete(redesign._id);
  },
});