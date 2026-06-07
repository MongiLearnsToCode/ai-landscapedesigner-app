import { Polar } from "@polar-sh/sdk";
import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { v } from "convex/values";
import { action, httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";
import { PLAN_LIMITS } from "./constants";

type BillingCycle = "monthly" | "annual";
type Plan = "Personal" | "Creator" | "Business";

const USER_FACING_CHECKOUT_ERROR = "Unable to start checkout. Please contact support.";

const PRODUCT_ENV_KEYS: Record<Plan, Record<BillingCycle, string>> = {
  Personal: {
    monthly: "POLAR_PRODUCT_PERSONAL_MONTHLY",
    annual: "POLAR_PRODUCT_PERSONAL_ANNUAL",
  },
  Creator: {
    monthly: "POLAR_PRODUCT_CREATOR_MONTHLY",
    annual: "POLAR_PRODUCT_CREATOR_ANNUAL",
  },
  Business: {
    monthly: "POLAR_PRODUCT_BUSINESS_MONTHLY",
    annual: "POLAR_PRODUCT_BUSINESS_ANNUAL",
  },
};

const PRODUCT_PLAN_BY_ENV_KEY = new Map<string, Plan>(
  Object.entries(PRODUCT_ENV_KEYS).flatMap(([plan, cycles]) =>
    Object.values(cycles).map((envKey) => [envKey, plan as Plan])
  )
);

function getPolarClient() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }

  return new Polar({
    accessToken,
    server: process.env.POLAR_SANDBOX === "true" ? "sandbox" : "production",
  });
}

function productIdFor(plan: Plan, billingCycle: BillingCycle) {
  const envKey = PRODUCT_ENV_KEYS[plan][billingCycle];
  const productId = process.env[envKey];

  if (!productId) {
    throw new Error(`${envKey} is not configured`);
  }

  return productId;
}

function planForProduct(productId?: string, productName?: string): Plan | "Free" {
  if (productId) {
    for (const [envKey, plan] of PRODUCT_PLAN_BY_ENV_KEY.entries()) {
      if (process.env[envKey] === productId) return plan;
    }
  }

  const normalizedProductName = productName?.replace(/\s+plan$/i, "").trim();
  if (normalizedProductName && normalizedProductName in PLAN_LIMITS) {
    return normalizedProductName as Plan;
  }

  return "Free";
}

function timestamp(value?: Date | string | number | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.getTime();
}

function requestHeaders(request: Request) {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

function base64Encode(value: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(value)));
}

function validatePolarEvent(body: string, headers: Record<string, string>, secret: string) {
  return new Webhook(base64Encode(secret)).verify(body, headers);
}

function eventIdFor(event: any) {
  const dataId = event.data?.id ?? "unknown";
  const eventTimestamp = event.timestamp
    ? event.timestamp instanceof Date
      ? event.timestamp.toISOString()
      : String(event.timestamp)
    : "no-timestamp";
  return `polar:${event.type}:${dataId}:${eventTimestamp}`;
}

function subscriptionUserId(subscription: any) {
  return subscription.customer?.external_id
    ?? subscription.customer?.externalId
    ?? subscription.external_customer_id
    ?? subscription.externalCustomerId
    ?? subscription.metadata?.convexUserId;
}

function orderUserId(order: any) {
  return order.customer?.external_id
    ?? order.customer?.externalId
    ?? order.external_customer_id
    ?? order.externalCustomerId
    ?? order.metadata?.convexUserId;
}

function polarErrorDetails(error: unknown) {
  if (!(error instanceof Error)) return { message: String(error) };

  return {
    name: error.name,
    message: error.message,
  };
}

function subscriptionUpdate(subscription: any) {
  const productId = subscription.product_id ?? subscription.productId;
  const productName = subscription.product?.name;
  const recurringInterval = subscription.recurring_interval ?? subscription.recurringInterval;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end ?? subscription.cancelAtPeriodEnd;
  const currentPeriodEnd = subscription.current_period_end ?? subscription.currentPeriodEnd;
  const customerId = subscription.customer_id ?? subscription.customerId;

  const plan = subscription.product?.metadata?.plan && subscription.product.metadata.plan in PLAN_LIMITS
    ? subscription.product.metadata.plan as Plan
    : planForProduct(productId, productName);
  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const isGraceState = subscription.status === "past_due";
  const hasAccess = (isActive || isGraceState) && plan !== "Free";
  const planConfig = hasAccess ? PLAN_LIMITS[plan] : PLAN_LIMITS.Free;

  return {
    status: cancelAtPeriodEnd && isActive ? "canceled" : subscription.status,
    plan: hasAccess ? planConfig.plan : "Free",
    billingCycle: recurringInterval === "year" ? "annual" : "monthly",
    limit: planConfig.limit,
    subscriptionId: subscription.id,
    polarCustomerId: customerId,
    currentPeriodEnd: timestamp(currentPeriodEnd),
  };
}

export const createCheckout = action({
  args: {
    plan: v.union(v.literal("Personal"), v.literal("Creator"), v.literal("Business")),
    billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
    successUrl: v.string(),
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) throw new Error("User not found");

    const polar = getPolarClient();
    let checkout;
    try {
      checkout = await polar.checkouts.create({
        products: [productIdFor(args.plan, args.billingCycle)],
        externalCustomerId: userId,
        customerEmail: user.email,
        customerName: user.name ?? undefined,
        successUrl: args.successUrl,
        returnUrl: args.returnUrl,
        metadata: {
          convexUserId: userId,
          plan: args.plan,
          billingCycle: args.billingCycle,
        },
      });
    } catch (error) {
      console.error("Polar checkout creation failed", {
        ...polarErrorDetails(error),
        plan: args.plan,
        billingCycle: args.billingCycle,
        sandbox: process.env.POLAR_SANDBOX === "true",
      });
      throw new Error(USER_FACING_CHECKOUT_ERROR);
    }

    return { url: checkout.url };
  },
});

export const createCustomerPortalSession = action({
  args: {
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const polar = getPolarClient();
    const session = await polar.customerSessions.create({
      externalCustomerId: userId,
      returnUrl: args.returnUrl,
    });

    return { url: session.customerPortalUrl };
  },
});

export const polarWebhook = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("POLAR_WEBHOOK_SECRET is not configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.text();
  let event: any;

  try {
    event = validatePolarEvent(body, requestHeaders(request), webhookSecret);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Polar webhook validation error:", error);
    return new Response(JSON.stringify({ error: "Webhook validation failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const eventId = eventIdFor(event);
    const logResult = await ctx.runMutation(api.webhooks.logWebhookEvent, {
      eventId,
      provider: "polar",
      eventType: event.type,
      payload: event,
    });

    if (logResult.alreadyProcessed) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    switch (event.type) {
      case "subscription.created":
      case "subscription.active":
      case "subscription.updated":
      case "subscription.uncanceled":
      case "subscription.past_due":
      case "subscription.canceled":
      case "subscription.revoked":
        await handleSubscriptionEvent(ctx, event.data);
        break;
      case "order.created":
      case "order.paid":
      case "order.updated":
        await handleOrderEvent(ctx, event.data);
        break;
      default:
        break;
    }

    await ctx.runMutation(api.webhooks.markWebhookProcessed, { eventId });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Polar webhook processing error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function handleSubscriptionEvent(ctx: any, subscription: any) {
  const userId = subscriptionUserId(subscription);
  if (!userId) {
    console.error("Polar subscription missing external customer id:", subscription.id);
    return;
  }

  await ctx.runMutation(api.users.updateSubscription, {
    userId,
    ...subscriptionUpdate(subscription),
  });
}

async function handleOrderEvent(ctx: any, order: any) {
  const userId = orderUserId(order);
  const customerId = order.customer_id ?? order.customerId ?? order.customer?.id;

  if (!userId || !customerId) return;

  await ctx.runMutation(api.users.linkPolarCustomer, {
    userId,
    polarCustomerId: customerId,
  });
}
