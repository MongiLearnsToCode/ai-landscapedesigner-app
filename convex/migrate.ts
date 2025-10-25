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
    })),
  },
  handler: async (ctx, args) => {
    // Insert users
    for (const user of args.users) {
      await ctx.db.insert("users", { ...user, isPremium: false });
    }

    // Insert redesigns
    for (const redesign of args.redesigns) {
      await ctx.db.insert("redesigns", { ...redesign, isPinned: false, createdAt: Date.now() });
    }
  },
});