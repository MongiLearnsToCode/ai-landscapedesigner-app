# 🔒 SECURITY TASK PLAN - Incremental Implementation

## Overview
- Total task groups: 6
- Estimated total time: 4-5 hours
- Breaking changes: 1 group (flagged with ⚠️)
- Can pause after any group: ✅

---

## 📋 TASK GROUP 1: Update Vulnerable Dependencies

**Priority:** High  
**Risk:** Non-breaking  
**Time estimate:** 30 minutes  
**Dependencies:** None  

### What This Fixes:
- Dependency vulnerabilities identified in audit
- Deprecated package warnings
- Security updates for better-auth remnants

### Files to Modify:
- `package.json` - Update dependency versions
- `pnpm-lock.yaml` - Will update automatically

### Step-by-Step Implementation:

1. **Backup current state**
   ```bash
   git commit -am "Pre-dependency-update checkpoint"
   git tag security-checkpoint-1
   ```

2. **Update package.json dependencies:**
   ```json
   // Update these versions (check latest):
   "@clerk/clerk-react": "^5.55.0",
   "drizzle-orm": "^0.45.0",
   "vite": "^6.3.0"
   ```

3. **Remove any deprecated dependencies** if identified

4. **Run dependency update:**
   ```bash
   pnpm update
   pnpm audit
   ```

5. **Test build:**
   ```bash
   pnpm run build
   ```

### ✅ Verification Tests:

**Automated Tests:**
```bash
pnpm audit --audit-level moderate
# Should show no critical/high vulnerabilities
```

**Manual Testing Checklist:**
- [ ] App builds successfully without errors
- [ ] Development server starts: `pnpm run dev`
- [ ] No console errors in browser
- [ ] Authentication still works (sign in/out)

### 🔄 Rollback Instructions:

If anything breaks:
```bash
git reset --hard security-checkpoint-1
pnpm install
pnpm run dev
# Verify app works: [sign in and create a design]
```

### 🛑 CHECKPOINT:

> **Before proceeding to Task Group 2, confirm:**
>
> 1. ✅ All verification tests pass? (yes/no)
> 2. ✅ App still works as expected? (yes/no)
> 3. ⚠️ Any unexpected behavior? (describe/none)
>
> **Type 'continue' to proceed to Task Group 2, 'rollback' to undo, or 'debug' to investigate issues.**

---

## 📋 TASK GROUP 2: Implement Rate Limiting

**Priority:** High  
**Risk:** Non-breaking  
**Time estimate:** 45 minutes  
**Dependencies:** Task Group 1 must be complete ✅

### What This Fixes:
- Missing rate limiting on API endpoints
- Protection against abuse attacks

### Files to Modify:
- `package.json` - Add rate limiting library
- `services/geminiService.ts` - Add rate limiting
- `services/cloudinaryService.ts` - Add rate limiting

### Step-by-Step Implementation:

1. **Install rate limiting library:**
   ```bash
   pnpm add express-rate-limit
   pnpm add -D @types/express-rate-limit
   ```

2. **Create rate limiting utility:**
   ```typescript
   // services/rateLimit.ts
   import rateLimit from 'express-rate-limit';

   export const createRateLimit = (windowMs: number, max: number) =>
     rateLimit({
       windowMs,
       max,
       message: 'Too many requests, please try again later.',
       standardHeaders: true,
       legacyHeaders: false,
     });

   export const apiLimiter = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
   export const authLimiter = createRateLimit(15 * 60 * 1000, 5);  // 5 auth attempts per 15 minutes
   ```

3. **Apply to services** (if they become API endpoints in future)

### ✅ Verification Tests:

**Manual Testing Checklist:**
- [ ] Rate limiting library installed without conflicts
- [ ] App builds and runs normally
- [ ] No performance degradation

### 🔄 Rollback Instructions:

```bash
git reset --hard security-checkpoint-2
pnpm install
```

---

## 📋 TASK GROUP 3: Add Data Minimization

**Priority:** Medium  
**Risk:** Non-breaking  
**Time estimate:** 30 minutes  
**Dependencies:** Task Group 2 must be complete ✅

### What This Fixes:
- API responses include unnecessary data
- Potential information disclosure

### Files to Modify:
- `services/historyService.ts` - Sanitize responses
- `services/databaseService.ts` - Add field selection

### Step-by-Step Implementation:

1. **Update history service responses:**
   ```typescript
   // Remove internal fields from responses
   const sanitizeHistoryItem = (item: any) => ({
     id: item.id,
     title: item.title,
     imageUrl: item.imageUrl,
     createdAt: item.createdAt,
     // Exclude: user_id, updatedAt, internal metadata
   });
   ```

2. **Apply sanitization in all service methods**

### ✅ Verification Tests:

**Manual Testing Checklist:**
- [ ] History loading still works
- [ ] No sensitive data in network responses
- [ ] App functionality preserved

---

## 📋 TASK GROUP 4: Create Sitemap and Robots.txt

**Priority:** Low  
**Risk:** Non-breaking  
**Time estimate:** 15 minutes  
**Dependencies:** Task Group 3 must be complete ✅

### What This Fixes:
- Missing crawler control files
- Better SEO and security

### Files to Modify:
- `public/robots.txt` - Create new file
- `public/sitemap.xml` - Create new file

### Step-by-Step Implementation:

1. **Create public/robots.txt:**
   ```
   User-agent: *
   Allow: /
   Disallow: /api/
   Disallow: /admin/
   ```

2. **Create public/sitemap.xml:**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url><loc>https://yourdomain.com/</loc></url>
     <url><loc>https://yourdomain.com/designer</loc></url>
     <url><loc>https://yourdomain.com/history</loc></url>
   </urlset>
   ```

### ✅ Verification Tests:

**Manual Testing Checklist:**
- [ ] Files accessible at /robots.txt and /sitemap.xml
- [ ] No sensitive paths exposed

---

## 📋 TASK GROUP 5: Improve Error Handling

**Priority:** Low  
**Risk:** Non-breaking  
**Time estimate:** 30 minutes  
**Dependencies:** Task Group 4 must be complete ✅

### What This Fixes:
- Error messages may leak internal details
- Better security through obscurity

### Files to Modify:
- `services/geminiService.ts` - Sanitize errors
- `services/cloudinaryService.ts` - Sanitize errors
- `contexts/AppContext.tsx` - Add error boundaries

### Step-by-Step Implementation:

1. **Create error sanitization utility:**
   ```typescript
   export const sanitizeError = (error: any): string => {
     // Return generic messages, never internal details
     if (error.message?.includes('API key')) return 'Service temporarily unavailable';
     return 'An unexpected error occurred';
   };
   ```

2. **Apply to all service error handling**

### ✅ Verification Tests:

**Manual Testing Checklist:**
- [ ] Error messages are generic and don't leak secrets
- [ ] App handles errors gracefully

---

## 📋 TASK GROUP 6: ⚠️ Database ID Obfuscation (Breaking Change)

**Priority:** Medium  
**Risk:** Breaking ⚠️  
**Time estimate:** 60 minutes  
**Dependencies:** Task Group 5 must be complete ✅

### What This Fixes:
- Predictable sequential IDs
- Enumeration attack prevention

### Files to Modify:
- `db/schema.ts` - Change ID types to UUID
- `services/databaseService.ts` - Update queries
- Migration scripts

### Step-by-Step Implementation:

1. **Update schema to use UUIDs:**
   ```typescript
   import { uuid } from 'drizzle-orm/pg-core';

   export const history = pgTable('history', {
     id: uuid('id').primaryKey().defaultRandom(),
     // ... other fields
   });
   ```

2. **Create migration script**

3. **Update all queries to handle UUIDs**

### ✅ Verification Tests:

**Manual Testing Checklist:**
- [ ] Database migration successful
- [ ] All CRUD operations work with UUIDs
- [ ] No breaking changes to user experience

### 🔄 Rollback Instructions:

**⚠️ Complex rollback - database migration**
```bash
# This requires database backup restoration
# Contact DBA for rollback procedure
```

---

## 📊 Quick Reference: Task Group Order

1. ⏳ Task Group 1: Update Dependencies (Non-breaking, 30 min)
2. ⏳ Task Group 2: Rate Limiting (Non-breaking, 45 min)
3. ⏳ Task Group 3: Data Minimization (Non-breaking, 30 min)
4. ⏳ Task Group 4: Sitemap/Robots (Non-breaking, 15 min)
5. ⏳ Task Group 5: Error Handling (Non-breaking, 30 min)
6. ⏳ Task Group 6: UUID Migration ⚠️ (Breaking, 60 min, database changes)

**Recommended approach:** Complete groups 1-5 first (all non-breaking), then tackle group 6 in a separate session.

## 🎯 Implementation Strategy

- **Session 1:** Task Groups 1-3 (dependency updates and basic security, ~2 hours)
- **Session 2:** Task Groups 4-5 (finishing touches, ~1 hour)
- **Session 3:** Task Group 6 (breaking database change, ~1.5 hours with testing)</content>
</xai:function_call ><xai:function_call name="write">
<parameter name="filePath">ROLLBACK_PLAN.md