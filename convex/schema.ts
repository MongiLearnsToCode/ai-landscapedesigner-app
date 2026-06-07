import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    // User profile fields (extends Convex Auth's auth accounts)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.string(),
    emailVerified: v.optional(v.boolean()),

    // User-controlled profile and app preferences
    emailNotifications: v.optional(v.boolean()),
    productUpdates: v.optional(v.boolean()),
    defaultClimateZone: v.optional(v.string()),
    defaultStyles: v.optional(v.array(v.string())),
    defaultRedesignDensity: v.optional(v.string()),
    defaultAllowStructuralChanges: v.optional(v.boolean()),
    defaultLockAspectRatio: v.optional(v.boolean()),

    // Polar billing integration
    polarCustomerId: v.optional(v.string()),

    // Subscription tracking
    subscriptionStatus: v.optional(v.string()), // active, canceled, past_due, trialing, expired
    subscriptionPlan: v.optional(v.string()),   // Personal, Creator, Business, Free
    billingCycle: v.optional(v.string()),       // monthly, annual
    subscriptionId: v.optional(v.string()),

    // Entitlement tracking
    expirationDate: v.optional(v.number()),     // Timestamp
    currentPeriodEnd: v.optional(v.number()),   // Timestamp

    // Monthly limits
    monthlyRedesignLimit: v.optional(v.number()),
    redesignsUsedThisMonth: v.optional(v.number()),
    currentMonthStart: v.optional(v.number()),  // timestamp
    // Deprecated: isPremium from old schema
    isPremium: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_polar_customer", ["polarCustomerId"]),

  redesigns: defineTable({
    userId: v.optional(v.id("users")),
    redesignId: v.string(),
    originalImageUrl: v.string(),
    redesignedImageUrl: v.string(),
    designCatalog: v.any(), // JSON object
    styles: v.any(), // Array of styles
    climateZone: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    createdAt: v.optional(v.number()), // timestamp
  })
    .index("by_user", ["userId"])
    .index("by_redesign_id", ["redesignId"])
    .index("by_user_and_date", ["userId", "createdAt"]),

  // Webhook events log (for debugging and idempotency)
  webhookEvents: defineTable({
    eventId: v.string(), // External event ID
    provider: v.optional(v.string()),
    eventType: v.string(),
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    payload: v.any(),
  }).index("by_event_id", ["eventId"]),
});
