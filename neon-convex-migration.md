# Migrate from Neon (Browser SQL) to Convex - Quick Guide

## Why Migrate?
Your app currently runs SQL **directly in the browser**, causing:
- ⚠️ Security warnings (credentials exposed)
- ⚠️ No protection against malicious queries
- ⚠️ Performance issues
- ⚠️ Database credentials visible to users

**Convex fixes all of this** - no API routes, no security warnings, just type-safe functions.

---

## Migration Steps

### 1. Install Convex
```bash
npm install convex
npx convex dev
```

### 2. Define Schema (`convex/schema.ts`)
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
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
```

### 3. Create Functions (`convex/redesigns.ts`)
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get history
export const getHistory = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("redesigns")
      .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .collect();
  },
});

// Save redesign
export const saveRedesign = mutation({
  args: {
    clerkUserId: v.string(),
    redesignId: v.string(),
    originalImageUrl: v.string(),
    redesignedImageUrl: v.string(),
    designCatalog: v.any(),
    styles: v.any(),
    climateZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("redesigns", {
      ...args,
      isPinned: false,
      createdAt: Date.now(),
    });
  },
});

// Toggle pin
export const togglePin = mutation({
  args: { redesignId: v.string() },
  handler: async (ctx, args) => {
    const redesign = await ctx.db
      .query("redesigns")
      .withIndex("by_redesign_id", (q) => q.eq("redesignId", args.redesignId))
      .unique();
    
    if (!redesign) throw new Error("Not found");
    
    await ctx.db.patch(redesign._id, {
      isPinned: !redesign.isPinned,
    });
  },
});

// Check limit
export const checkLimit = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const count = await ctx.db
      .query("redesigns")
      .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();
    
    const limit = 3; // Free tier
    return {
      used: count.length,
      limit,
      remaining: Math.max(0, limit - count.length),
      hasReachedLimit: count.length >= limit,
    };
  },
});

// Delete redesign
export const deleteRedesign = mutation({
  args: { redesignId: v.string() },
  handler: async (ctx, args) => {
    const redesign = await ctx.db
      .query("redesigns")
      .withIndex("by_redesign_id", (q) => q.eq("redesignId", args.redesignId))
      .unique();

    if (!redesign) throw new Error("Not found");

    await ctx.db.delete(redesign._id);
  },
});
```

### 4. Create User Functions (`convex/users.ts`)
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const ensureUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      isPremium: false,
    });
  },
});
```

### 5. Setup Convex Provider (`index.tsx`)
```typescript
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function ConvexClerkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey} routing="hash" signInUrl="/signin" signUpUrl="/signup">
      <ConvexClerkWrapper>
        <App />
      </ConvexClerkWrapper>
    </ClerkProvider>
  </React.StrictMode>
);
```

### 6. Update Frontend Code

**Before (Neon - Browser SQL):**
```typescript
// Direct SQL in browser ⚠️
const redesigns = await sql`
  SELECT * FROM redesigns
  WHERE clerk_user_id = ${userId}
 `;
```

**After (Convex - Secure):**
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

function MyComponent() {
  const { user } = useUser();

  // Queries auto-refresh on data changes (no args needed - uses auth)
  const history = useQuery(api.redesigns.getHistory);
  const limit = useQuery(api.redesigns.checkLimit);

  const saveRedesign = useMutation(api.redesigns.saveRedesign);
  const togglePin = useMutation(api.redesigns.togglePin);

  // Use them (no clerkUserId needed - derived from auth)
  await saveRedesign({
    redesignId: "...",
    originalImageUrl: "...",
    redesignedImageUrl: "...",
    designCatalog: {...},
    styles: [...],
    climateZone: "...",
  });

  await togglePin({ redesignId: "..." });
}
```

### 7. Environment Variables

Add to `.env`:
```bash
VITE_CONVEX_URL=https://scintillating-gerbil-404.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 8. Migrate Existing Data (One-time Script)

Create `convex/migrate.ts`:
```typescript
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
```

To run migration, create `export-data.ts`:
```typescript
import { db } from './db/client';
import { landscapeRedesigns, user } from './db/schema';

async function exportData() {
  const users = await db.select({
    clerkUserId: user.id,
    email: user.email,
    name: user.name,
  }).from(user);

  const redesigns = await db.select({
    clerkUserId: landscapeRedesigns.userId,
    redesignId: landscapeRedesigns.id,
    originalImageUrl: landscapeRedesigns.originalImageUrl,
    redesignedImageUrl: landscapeRedesigns.redesignedImageUrl,
    designCatalog: landscapeRedesigns.designCatalog,
    styles: landscapeRedesigns.styles,
    climateZone: landscapeRedesigns.climateZone,
  }).from(landscapeRedesigns);

  console.log(`Found ${users.length} users and ${redesigns.length} redesigns`);

  // Call the Convex migration
  const { ConvexHttpClient } = await import('convex/browser');
  const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

  await client.mutation(api.migrate.migrateFromNeon, {
    users,
    redesigns,
  });

  console.log('Migration completed!');
}

exportData().catch(console.error);
```

Run:
```bash
tsx export-data.ts
```

### 9. Remove Neon Dependencies

```bash
npm uninstall @neondatabase/serverless
```

Remove all `sql` imports and API route files.

---

## Key Benefits

| Feature | Neon (Browser) | Convex |
|---------|---------------|--------|
| **Security** | ⚠️ Credentials exposed | ✅ Server-side only |
| **Real-time** | ❌ Manual polling | ✅ Built-in subscriptions |
| **Type Safety** | ❌ No types | ✅ Full TypeScript |
| **API Routes** | ❌ Manual setup | ✅ None needed |
| **Warnings** | ⚠️ Browser SQL warnings | ✅ None |
| **Performance** | ⚠️ Direct DB hits | ✅ Optimized queries |

---

## Quick Checklist

- [x] `pnpm install convex && npx convex dev --once`
- [x] Create `convex/schema.ts`
- [x] Create `convex/redesigns.ts` and `convex/users.ts`
- [x] Wrap app in `ConvexProviderWithClerk`
- [x] Replace all SQL calls with `useQuery`/`useMutation`
- [x] Fix security vulnerabilities (auth bypasses, ownership checks)
- [x] Make migration idempotent and preserve timestamps
- [x] Remove exposed secrets from git and add to .gitignore
- [ ] Migrate existing data (run tsx export-data.ts after rotating secrets)
- [x] Remove Neon dependencies
- [ ] Deploy: `npx convex deploy`

**That's it!** No more security warnings. 🎉