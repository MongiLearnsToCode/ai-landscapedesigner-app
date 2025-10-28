import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Log webhook event (for idempotency)
export const logWebhookEvent = mutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if already processed
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .unique();

    if (existing) {
      return { alreadyProcessed: true };
    }

    // Log event
    await ctx.db.insert("webhookEvents", {
      eventId: args.eventId,
      eventType: args.eventType,
      payload: args.payload,
      processed: false,
    });

    return { alreadyProcessed: false };
  },
});

// Mark webhook as processed
export const markWebhookProcessed = mutation({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .unique();

    if (!event) throw new Error("Event not found");

    await ctx.db.patch(event._id, {
      processed: true,
      processedAt: Date.now(),
    });
  },
});