In .env around line 18, the file currently defines VITE_DATABASE_URL which
exposes the DB connection string to the client; replace that entry with
DATABASE_URL (server-side only) and update any server-side config/usage to read
DATABASE_URL instead of VITE_DATABASE_URL, then remove or stop referencing
VITE_DATABASE_URL in client build/config so the DB URL is not leaked to the
frontend.

In .env around lines 21 to 23 the file contains real Polar secrets
(POLAR_ACCESS_TOKEN and POLAR_WEBHOOK_SECRET); revoke/rotate them immediately in
the Polar dashboard, replace the values here with non-sensitive placeholders
(e.g. POLAR_ACCESS_TOKEN=REPLACE_ME), add .env to .gitignore, and remove the
secrets from git history using a history-rewrite tool (git filter-repo or BFG)
then force-push the cleaned branch; after purge, create new tokens only in your
deployment secret store (Vercel/Render/Railway/etc.) and update runtime config
there, and ensure any webhook signing keys are rotated/invalidated so the old
secrets cannot be used.

In .env around line 27, the POLAR_SUCCESS_URL value contains a typo
"successcom"; update the URL path to end with "/subscription/success" (replace
"successcom" with "success") so the success redirect points to the correct
route.

In .env.example around lines 20 to 33, the example is missing the frontend price
ID variables and lacks a trailing newline; add entries for the price IDs the
frontend expects (e.g. VITE_PERSONAL_PRICE_ID, VITE_CREATOR_PRICE_ID,
VITE_BUSINESS_PRICE_ID) with placeholder values, ensure the keys match the
frontend variable names exactly, keep the Polar configuration and product IDs in
sync, and add a final blank line at the end of the file to satisfy linters.

In api/polar.ts around lines 13-64, this file duplicates business logic already
implemented in services/polarService.ts and reuses ClerkUser inline; remove the
full implementation here and replace it with a thin wrapper that imports
getOrCreatePolarCustomer (and any other needed functions like getPolarCustomer,
requireActiveSubscription) from services/polarService.ts and re-exports or
delegates to them, and import the ClerkUser type from the shared types module
(extract it if not already available) so this module only forwards calls and
types, eliminating duplicated logic and keeping a single source of truth in
services/polarService.ts.

In db/schema.ts around lines 78 to 86, rename the Polar.sh integration table
from 'users' to 'polar_users' to avoid colliding with the existing "user" table,
and add the same updatedAt on-update behavior used elsewhere by adding the
$onUpdate handler to the updatedAt column (so updatedAt is defaultNow() and also
updated automatically on row updates). Ensure the pgTable first argument is
changed to 'polar_users' and updatedAt matches the other tables' $onUpdate
pattern.

Strengthen subscriptions integrity and query performance.

    userId should be NOT NULL; your service queries by userId and will silently miss rows when null.
    Status should be constrained (enum) to valid Polar states.
    Add indexes used by lookups.
    Auto-update updatedAt.

 export const subscriptions = pgTable('subscriptions', {
   id: uuid('id').primaryKey().defaultRandom(),
-  userId: uuid('user_id').references(() => polarUsers.id, { onDelete: "cascade" }),
+  userId: uuid('user_id').notNull().references(() => polarUsers.id, { onDelete: "cascade" }),
   polarSubscriptionId: varchar('polar_subscription_id', { length: 255 }).unique().notNull(),
   polarCustomerId: varchar('polar_customer_id', { length: 255 }).notNull(),
   polarProductId: varchar('polar_product_id', { length: 255 }).notNull(),
-  status: varchar('status', { length: 50 }).notNull(), // incomplete, active, canceled, past_due, unpaid
+  status: varchar('status', { length: 50 }).notNull(), // consider pgEnum for valid values
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
-  updatedAt: timestamp('updated_at').defaultNow().notNull(),
+  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
 });
 
 Optionally add indexes (Drizzle example):
 // after table declaration
export const subscriptionsUserIdx = index("subscriptions_user_idx").on(subscriptions.userId);
export const subscriptionsCustomerIdx = index("subscriptions_customer_idx").on(subscriptions.polarCustomerId);


In db/schema.ts around lines 110 to 119, the webhook_events table currently
stores full payloads indefinitely which can retain PII and lacks efficient sweep
support; add an index on the processed column (and consider an index on
processed_at) to support fast deletion scans, implement a scheduled
retention/cleanup job that deletes rows where processed = true and processed_at
is older than a configurable N days, modify the insert/upsert logic to use
webhookId for idempotency (skip or update if webhookId already exists), and
introduce either payload minimization (redact PII before persist) or at-rest
encryption for the payload column with a migration path and config toggle so
payloads can be redacted/encrypted as needed.

In pages/PricingPage.tsx around lines 172-177, the checkout handler redirects
unauthenticated users immediately without waiting for Clerk's auth state,
causing premature sign-in redirects while auth is still loading; update the
handler to check Clerk's isLoaded (or equivalent loading flag) first and defer
redirect until isLoaded is true — if auth is not yet loaded, either return/no-op
(or disable the checkout action) so the function doesn't call
onNavigate('signin') prematurely, and only perform the user check and redirect
after isLoaded indicates auth has finished loading.

In pages/PricingPage.tsx around lines 338 to 360, the UI computes a price based
on billingCycle but only sends product.id to the backend, losing the selected
billing cycle; update the checkout call to send the selected price.id (and you
may also include product.id) so the server can create the correct Stripe
session. Modify the onClick/handleCheckout invocation to pass the chosen priceId
(derive it from product.prices using the billingCycle) and then update the
handleCheckout handler to accept and forward priceId to the API payload instead
of relying solely on productId.

In server.ts around lines 8 to 19, dotenv is being loaded after constructing the
Polar client which can leave accessToken undefined and duplicates initialization
already implemented in src/lib/polar.ts; load environment variables before any
Polar usage (call dotenv.config() at the top of server.ts), remove the dynamic
Polar construction here, and instead import and reuse the client/factory
exported from src/lib/polar.ts (or call its initializer) so there is a single
source of truth for creating the Polar client; ensure error handling stays in
place by delegating to the lib function or checking the imported client for
null/undefined and logging any initialization error.

In server.ts around lines 31 to 33, the app currently applies requireAuth as a
global middleware which inadvertently enforces authentication on public
endpoints like /api/contact and /api/products; remove the global
app.use(requireAuth(...)) call and instead attach requireAuth only to the routes
or routers that need protection (either add requireAuth as a middleware argument
on specific route handlers or call protectedRouter.use(requireAuth()) and mount
that router), ensuring public routes remain accessible without auth.

In server.ts around lines 315 to 332, replace the hardcoded placeholder Clerk
user with a real server-side fetch using the Clerk SDK: statically import
clerkClient at the top of the file and call await
clerkClient.users.getUser(auth.userId) to retrieve the user object, extract a
primary email and name (falling back safely if missing), use those values when
creating the customer/checkout, and handle errors/absent user by returning a
400/500 response as appropriate; do not leave placeholder values in production.

In server.ts around lines 337 to 345, the Polar SDK expects a products array and
the checkout redirect should use checkout.url; replace the productId field with
products: [productId] in the payload passed to polar.checkouts.create and ensure
the code redirects to checkout.url (not the checkout object itself) after
creation.

Fix race conditions and duplicate Polar customers with an upsert.

Concurrent requests can both miss the row and create two Polar customers; network errors when fetching an existing customer may also trigger unnecessary creation.

    Use a transaction.
    Upsert by clerkUserId.
    Only create a Polar customer when no local polarCustomerId exists.
 export async function getOrCreatePolarCustomer(clerkUser: ClerkUser) {
-  try {
-    // Check if user already exists in our database
-    const existingUser = await db
-      .select()
-      .from(polarUsers)
-      .where(eq(polarUsers.clerkUserId, clerkUser.id))
-      .limit(1);
+  try {
+    return await db.transaction(async (tx) => {
+      const existing = await tx.select().from(polarUsers)
+        .where(eq(polarUsers.clerkUserId, clerkUser.id)).limit(1);
 
-    if (existingUser.length > 0 && existingUser[0].polarCustomerId) {
+      if (existing.length > 0 && existing[0].polarCustomerId) {
         // User exists and has Polar customer ID, fetch from Polar
-      try {
-        const customer = await polar.customers.get({ id: existingUser[0].polarCustomerId });
-        return customer;
-      } catch (error) {
-        console.error('Failed to fetch existing Polar customer:', error);
-        // Customer might not exist in Polar, create new one
-      }
-    }
+        return await polar.customers.get({ id: existing[0].polarCustomerId });
+      }
 
-    // Create new Polar customer
-    const customer = await polar.customers.create({
+      const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
+      if (!primaryEmail) throw new Error('No email found for Clerk user');
+      const customer = await polar.customers.create({
         email: clerkUser.emailAddresses[0].emailAddress,
         name: clerkUser.fullName || clerkUser.firstName || 'User',
         metadata: { clerk_user_id: clerkUser.id },
-    });
+      });
 
-    // Store in our database
-    if (existingUser.length > 0) {
-      // Update existing user
-      await db
-        .update(polarUsers)
-        .set({ polarCustomerId: customer.id })
-        .where(eq(polarUsers.clerkUserId, clerkUser.id));
-    } else {
-      // Create new user record
-      await db.insert(polarUsers).values({
-        clerkUserId: clerkUser.id,
-        email: clerkUser.emailAddresses[0].emailAddress,
-        polarCustomerId: customer.id,
-      });
-    }
+      await tx.insert(polarUsers).values({
+        clerkUserId: clerkUser.id,
+        email: primaryEmail,
+        polarCustomerId: customer.id,
+      }).onConflictDoUpdate({
+        target: polarUsers.clerkUserId,
+        set: { polarCustomerId: customer.id },
+      });
 
-    return customer;
+      return customer;
-  } catch (error) {
+    });
+  } catch (error) {
     console.error('Error in getOrCreatePolarCustomer:', error);
     throw error;
   }
 }
 
 
 In services/polarService.ts around lines 34 to 41, the code assumes
clerkUser.emailAddresses[0].emailAddress exists which can be undefined and cause
a runtime error; guard against missing email by first checking for
emailAddresses and an element at index 0 (e.g. clerkUser.emailAddresses &&
clerkUser.emailAddresses[0] or using optional chaining), use a safe fallback
like clerkUser.primaryEmailAddress or an empty string / null depending on Polar
API requirements, and if email is required by Polar, validate and throw or
return a clear error before calling polar.customers.create so you never pass
undefined to the API.

Select the correct active subscription deterministically.

You pick an arbitrary row (limit 1) and only check status === 'active'. Prefer filtering and ordering to ensure correctness.
-    const subscription = await db
-      .select()
-      .from(subscriptions)
-      .where(eq(subscriptions.userId, user[0].id))
-      .limit(1);
+    const [subscription] = await db
+      .select()
+      .from(subscriptions)
+      .where(eq(subscriptions.userId, user[0].id))
+      // optionally filter for active here if not done via WHERE
+      .limit(10); // fetch some rows for logic below
+
+    // If multiple, choose one with status 'active' and latest currentPeriodEnd
+    const sub = (Array.isArray(subscription) ? subscription : [subscription])
+      .filter(s => s?.status === 'active')
+      .sort((a, b) => new Date(b.currentPeriodEnd ?? 0).getTime() - new Date(a.currentPeriodEnd ?? 0).getTime())[0];
+
-    if (subscription.length === 0 || subscription[0].status !== 'active') {
+    if (!sub) {
       throw new Error('Active subscription required');
     }
 
-    if (subscription[0].cancelAtPeriodEnd && subscription[0].currentPeriodEnd) {
+    if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
       const now = new Date();
-      const periodEnd = new Date(subscription[0].currentPeriodEnd);
+      const periodEnd = new Date(sub.currentPeriodEnd);
       if (now > periodEnd) {
         throw new Error('Subscription expired');
       }
     }
 
-    return subscription[0];
+    return sub;
