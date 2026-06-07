import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { auth } from "./auth";

const ALLOWED_STYLES = new Set([
  "modern",
  "minimalist",
  "rustic",
  "mediterranean",
  "japanese",
  "tropical",
  "farmhouse",
  "coastal",
  "desert",
  "urban-modern",
  "bohemian",
  "english-cottage",
]);

const ALLOWED_DENSITIES = new Set(["minimal", "default", "lush"]);

const cleanOptionalString = (value: string | undefined, maxLength: number) => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
};

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

// Update current user's profile fields
export const updateProfile = mutation({
  args: {
    name: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const name = cleanOptionalString(args.name, 80);
    if (!name) {
      throw new Error("Name is required");
    }

    const image = cleanOptionalString(args.image, 500);
    if (image && !/^https?:\/\//i.test(image)) {
      throw new Error("Profile image must be a valid URL");
    }

    await ctx.db.patch(userId, {
      name,
      image,
    });
  },
});

// Update current user's app defaults and notification preferences
export const updatePreferences = mutation({
  args: {
    emailNotifications: v.boolean(),
    productUpdates: v.boolean(),
    defaultClimateZone: v.optional(v.string()),
    defaultStyles: v.array(v.string()),
    defaultRedesignDensity: v.string(),
    defaultAllowStructuralChanges: v.boolean(),
    defaultLockAspectRatio: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const defaultStyles = args.defaultStyles
      .filter((style) => ALLOWED_STYLES.has(style))
      .slice(0, 2);

    if (defaultStyles.length === 0) {
      throw new Error("Select at least one default style");
    }

    if (!ALLOWED_DENSITIES.has(args.defaultRedesignDensity)) {
      throw new Error("Default density is invalid");
    }

    await ctx.db.patch(userId, {
      emailNotifications: args.emailNotifications,
      productUpdates: args.productUpdates,
      defaultClimateZone: cleanOptionalString(args.defaultClimateZone, 120),
      defaultStyles,
      defaultRedesignDensity: args.defaultRedesignDensity,
      defaultAllowStructuralChanges: args.defaultAllowStructuralChanges,
      defaultLockAspectRatio: args.defaultLockAspectRatio,
    });
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
      console.warn("Skipping subscription update for deleted or missing user:", args.userId);
      return { updated: false, reason: "user_not_found" };
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

    return { updated: true };
  },
});

export const deleteCurrentAccountData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) return { deleted: true, redesigns: 0 };

    const redesigns = await ctx.db
      .query("redesigns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const redesign of redesigns) {
      await ctx.db.delete(redesign._id);
    }

    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const refreshToken of refreshTokens) {
        await ctx.db.delete(refreshToken._id);
      }

      const verifiers = await ctx.db
        .query("authVerifiers")
        .filter((q) => q.eq(q.field("sessionId"), session._id))
        .collect();
      for (const verifier of verifiers) {
        await ctx.db.delete(verifier._id);
      }

      await ctx.db.delete(session._id);
    }

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      const verificationCodes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const verificationCode of verificationCodes) {
        await ctx.db.delete(verificationCode._id);
      }

      await ctx.db.delete(account._id);
    }

    const rateLimits = await ctx.db
      .query("authRateLimits")
      .filter((q) => q.eq(q.field("identifier"), user.email))
      .collect();
    for (const rateLimit of rateLimits) {
      await ctx.db.delete(rateLimit._id);
    }

    await ctx.db.delete(userId);

    return { deleted: true, redesigns: redesigns.length };
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
