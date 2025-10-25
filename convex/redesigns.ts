import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get history
export const getHistory = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("redesigns")
      .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .collect();
  },
});

// Save redesign
export const saveRedesign = mutation({
  args: {
    clerkUserId: v.string(),
    redesignId: v.string(),
    originalImageUrl: v.string(),
    redesignedImageUrl: v.string(),
    designCatalog: v.any(),
    styles: v.any(),
    climateZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("redesigns", {
      ...args,
      isPinned: false,
      createdAt: Date.now(),
    });
  },
});

// Toggle pin
export const togglePin = mutation({
  args: { redesignId: v.string() },
  handler: async (ctx, args) => {
    const redesign = await ctx.db
      .query("redesigns")
      .withIndex("by_redesign_id", (q) => q.eq("redesignId", args.redesignId))
      .unique();

    if (!redesign) throw new Error("Not found");

    await ctx.db.patch(redesign._id, {
      isPinned: !redesign.isPinned,
    });
  },
});

// Check limit
export const checkLimit = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const count = await ctx.db
      .query("redesigns")
      .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();

    const limit = 3; // Free tier
    return {
      used: count.length,
      limit,
      remaining: Math.max(0, limit - count.length),
      hasReachedLimit: count.length >= limit,
    };
  },
});

// Delete redesign
export const deleteRedesign = mutation({
  args: { redesignId: v.string() },
  handler: async (ctx, args) => {
    const redesign = await ctx.db
      .query("redesigns")
      .withIndex("by_redesign_id", (q) => q.eq("redesignId", args.redesignId))
      .unique();

    if (!redesign) throw new Error("Not found");

    await ctx.db.delete(redesign._id);
  },
});