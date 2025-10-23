import { pgTable, text, timestamp, boolean, json, integer, uuid, varchar, index } from 'drizzle-orm/pg-core';

// Better Auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// App-specific tables
export const landscapeRedesigns = pgTable('landscape_redesigns', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: "cascade" }),
  originalImageUrl: text('original_image_url').notNull(),
  redesignedImageUrl: text('redesigned_image_url').notNull(),
  designCatalog: json('design_catalog').notNull(),
  styles: json('styles').notNull(),
  climateZone: text('climate_zone'),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Polar.sh integration tables
export const polarUsers = pgTable('polar_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  polarCustomerId: varchar('polar_customer_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => polarUsers.id, { onDelete: "cascade" }),
  polarSubscriptionId: varchar('polar_subscription_id', { length: 255 }).unique().notNull(),
  polarCustomerId: varchar('polar_customer_id', { length: 255 }).notNull(),
  polarProductId: varchar('polar_product_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // incomplete, active, canceled, past_due, unpaid
  amount: integer('amount'), // in cents
  currency: varchar('currency', { length: 3 }).default('USD'),
  recurringInterval: varchar('recurring_interval', { length: 20 }), // 'day', 'month', 'year'
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at'),
  startedAt: timestamp('started_at'),
  endsAt: timestamp('ends_at'),
  endedAt: timestamp('ended_at'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Indexes for subscriptions table
export const subscriptionsUserIdx = index("subscriptions_user_idx").on(subscriptions.userId);
export const subscriptionsCustomerIdx = index("subscriptions_customer_idx").on(subscriptions.polarCustomerId);

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: varchar('webhook_id', { length: 255 }).unique().notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: json('payload').notNull(),
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Indexes for webhook_events table
export const webhookEventsProcessedIdx = index("webhook_events_processed_idx").on(webhookEvents.processed);
export const webhookEventsProcessedAtIdx = index("webhook_events_processed_at_idx").on(webhookEvents.processedAt);


