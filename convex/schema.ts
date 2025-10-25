import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    isPremium: v.optional(v.boolean()),
  }).index("by_clerk_id", ["clerkUserId"]),

  redesigns: defineTable({
    clerkUserId: v.string(),
    redesignId: v.string(),
    originalImageUrl: v.string(),
    redesignedImageUrl: v.string(),
    designCatalog: v.any(), // JSON object
    styles: v.any(), // Array of styles
    climateZone: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    createdAt: v.optional(v.number()), // timestamp
  })
    .index("by_user", ["clerkUserId"])
    .index("by_redesign_id", ["redesignId"]),
});