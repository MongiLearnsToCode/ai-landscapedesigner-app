import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const migrateFromNeon = internalMutation({
  args: {
    users: v.array(v.object({
      clerkUserId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    })),
    redesigns: v.array(v.object({
      clerkUserId: v.string(),
      redesignId: v.string(),
      originalImageUrl: v.string(),
      redesignedImageUrl: v.string(),
      designCatalog: v.any(),
      styles: v.any(),
      climateZone: v.optional(v.string()),
      createdAt: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Insert users (idempotent)
    for (const user of args.users) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", q => q.eq("clerkUserId", user.clerkUserId))
        .unique();
      if (!existing) {
        await ctx.db.insert("users", { ...user, isPremium: false });
      }
    }

    // Insert redesigns (idempotent)
    for (const redesign of args.redesigns) {
      const existing = await ctx.db
        .query("redesigns")
        .withIndex("by_redesign_id", q => q.eq("redesignId", redesign.redesignId))
        .unique();
      if (!existing) {
        await ctx.db.insert("redesigns", {
          ...redesign,
          isPinned: false,
          createdAt: redesign.createdAt ?? Date.now(),
        });
      }
    }
  },
});