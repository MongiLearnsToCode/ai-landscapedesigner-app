import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    // Legacy field - to be migrated (temporary for production deployment)
    isPremium: v.optional(v.boolean()),
    // Subscription tracking
    polarCustomerId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()), // active, canceled, past_due
    subscriptionPlan: v.optional(v.string()), // Personal, Creator, Business, Free
    billingCycle: v.optional(v.string()), // monthly, annual
    subscriptionId: v.optional(v.string()), // Polar subscription ID
    subscriptionPriceId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()), // timestamp
    // Monthly limits
    monthlyRedesignLimit: v.optional(v.number()),
    redesignsUsedThisMonth: v.optional(v.number()),
    currentMonthStart: v.optional(v.number()), // timestamp
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_polar_customer", ["polarCustomerId"]),

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
    .index("by_redesign_id", ["redesignId"])
    .index("by_user_and_date", ["clerkUserId", "createdAt"]),

  // Webhook events log (for debugging and idempotency)
  webhookEvents: defineTable({
    eventId: v.string(), // Polar event ID
    eventType: v.string(),
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    payload: v.any(),
  }).index("by_event_id", ["eventId"]),
});