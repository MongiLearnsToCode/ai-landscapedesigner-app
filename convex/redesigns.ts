import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get history
export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return []; // Return empty array if not authenticated

    return await ctx.db
      .query("redesigns")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .order("desc")
      .collect();
  },
});

// Save redesign
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

    return await ctx.db.insert("redesigns", {
      ...args,
      clerkUserId: identity.subject,
      isPinned: false,
      createdAt: Date.now(),
    });
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
    if (redesign.clerkUserId !== identity.subject) throw new Error("Not authorized");

    await ctx.db.patch(redesign._id, {
      isPinned: !redesign.isPinned,
    });
  },
});

// Check limit
export const checkLimit = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return default limit if not authenticated
      const limit = 3;
      return {
        used: 0,
        limit,
        remaining: limit,
        hasReachedLimit: false,
      };
    }

    const all = await ctx.db
      .query("redesigns")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    const limit = 3; // Free tier
    return {
      used: all.length,
      limit,
      remaining: Math.max(0, limit - all.length),
      hasReachedLimit: all.length >= limit,
    };
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
    if (redesign.clerkUserId !== identity.subject) throw new Error("Not authorized");

    await ctx.db.delete(redesign._id);
  },
});