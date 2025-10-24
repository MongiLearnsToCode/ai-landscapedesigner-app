# 🚨 CRITICAL SECURITY FIX: Remove Database Access from Frontend

## Problem Statement

The application is currently executing database queries directly from the browser, exposing database credentials and allowing anyone to read/modify data. This is a critical security vulnerability that must be fixed immediately.

**Evidence:**
- Browser console shows: "WARNING: Running SQL directly from the browser"
- Database credentials are bundled in client-side JavaScript
- Users can execute arbitrary SQL queries from browser DevTools

---

## Objective

Move ALL database operations from frontend to Express backend and replace with secure API calls.

---

## Phase 1: Audit Current Database Usage 🔍

### Task 1.1: Find All Frontend Database Imports

Search for files that import database code:

```bash
# Run these commands and document findings
grep -r "from './db" src/
grep -r "from '../db" src/
grep -r "import.*db.*from" src/
grep -r "drizzle" src/
```

**Expected culprits:**
- `src/services/historyService.ts`
- `src/services/databaseService.ts`
- `src/db/index.ts` (if in src/)
- Any component importing database schema

### Task 1.2: List All Database Operations

Document all database operations currently in frontend code:
- [ ] Fetching user history
- [ ] Saving redesigns
- [ ] Checking redesign limits
- [ ] Ensuring user exists
- [ ] Updating user data
- [ ] Pinning/unpinning items
- [ ] Deleting items

---

## Phase 2: Create Backend API Endpoints 🔧

### Task 2.1: Add History Management Endpoints

Add these routes to `server.js`:

```javascript
// server.js - Add after existing routes

import { v4 as uuidv4 } from 'uuid';
import { db } from './db/index.js';
import { user, landscapeRedesigns } from './db/schema.js';
import { eq, desc } from 'drizzle-orm';

// ============================================
// HISTORY API ROUTES
// ============================================

// GET /api/history - Fetch user's redesign history
app.get('/api/history', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    console.log('📋 Fetching history for user:', userId);

    const redesigns = await db
      .select()
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.userId, userId))
      .orderBy(desc(landscapeRedesigns.createdAt));

    console.log('✅ Found', redesigns.length, 'redesigns');

    res.json({ redesigns });
  } catch (error) {
    console.error('❌ Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/history - Save new redesign
app.post('/api/history', async (req, res) => {
  try {
    const { 
      userId, 
      originalImageUrl, 
      redesignedImageUrl, 
      catalog, 
      styles, 
      climateZone 
    } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!originalImageUrl || !redesignedImageUrl) {
      return res.status(400).json({ error: 'Image URLs required' });
    }

    console.log('💾 Saving redesign for user:', userId);

    const newRedesign = await db
      .insert(landscapeRedesigns)
      .values({
        id: uuidv4(),
        userId,
        originalImageUrl,
        redesignedImageUrl,
        designCatalog: catalog,
        styles: JSON.stringify(styles),
        climateZone,
        isPinned: false,
      })
      .returning();

    console.log('✅ Redesign saved:', newRedesign[0].id);

    res.json({ redesign: newRedesign[0] });
  } catch (error) {
    console.error('❌ Error saving redesign:', error);
    res.status(500).json({ error: 'Failed to save redesign' });
  }
});

// DELETE /api/history/:id - Delete a redesign
app.delete('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🗑️ Deleting redesign:', id);

    // Verify ownership before deleting
    const existing = await db
      .select()
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.id, id))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Redesign not found' });
    }

    if (existing[0].userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db
      .delete(landscapeRedesigns)
      .where(eq(landscapeRedesigns.id, id));

    console.log('✅ Redesign deleted');

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting redesign:', error);
    res.status(500).json({ error: 'Failed to delete redesign' });
  }
});

// PATCH /api/history/:id/pin - Toggle pin status
app.patch('/api/history/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📌 Toggling pin for redesign:', id);

    // Get current state
    const existing = await db
      .select()
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.id, id))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Redesign not found' });
    }

    if (existing[0].userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Toggle pin status
    const updated = await db
      .update(landscapeRedesigns)
      .set({ 
        isPinned: !existing[0].isPinned,
        updatedAt: new Date(),
      })
      .where(eq(landscapeRedesigns.id, id))
      .returning();

    console.log('✅ Pin status updated');

    res.json({ redesign: updated[0] });
  } catch (error) {
    console.error('❌ Error toggling pin:', error);
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
});

// ============================================
// USER API ROUTES
// ============================================

// POST /api/users/ensure - Create or update user
app.post('/api/users/ensure', async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'User ID and email required' });
    }

    console.log('👤 Ensuring user exists:', userId);

    const existing = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(user).values({
        id: userId,
        email,
        name: name || 'User',
        emailVerified: true,
      });
      console.log('✅ New user created');
    } else {
      await db
        .update(user)
        .set({ name, email, updatedAt: new Date() })
        .where(eq(user.id, userId));
      console.log('✅ User updated');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error ensuring user:', error);
    res.status(500).json({ error: 'Failed to ensure user' });
  }
});

// GET /api/users/redesign-limit - Check redesign usage limit
app.get('/api/users/redesign-limit', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    console.log('🔍 Checking redesign limit for user:', userId);

    // Count redesigns for this user
    const redesigns = await db
      .select()
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.userId, userId));

    const used = redesigns.length;
    const limit = 3; // Free tier limit
    const remaining = Math.max(0, limit - used);

    console.log('✅ Limit check:', { used, remaining });

    res.json({ 
      canRedesign: remaining > 0,
      remaining,
      used,
      limit,
    });
  } catch (error) {
    console.error('❌ Error checking limit:', error);
    res.status(500).json({ error: 'Failed to check limit' });
  }
});
```

---

## Phase 3: Update Frontend Services 🎨

### Task 3.1: Update historyService.ts

Replace ALL database imports and operations with API calls:

```typescript
// src/services/historyService.ts
// REMOVE these imports:
// import { db } from '../db/index.js';
// import { landscapeRedesigns } from '../db/schema.js';
// import { eq, desc } from 'drizzle-orm';

import type { 
  ImageFile, 
  DesignCatalog, 
  LandscapingStyle, 
  HydratedHistoryItem 
} from '../types';
import { uploadToCloudinary, uploadRedesignedImage } from './cloudinaryService';

let currentUserId: string | null = null;

export function setCurrentUserId(userId: string | null) {
  console.log('🆔 setCurrentUserId called:', userId);
  currentUserId = userId;
}

export async function getHistory(): Promise<HydratedHistoryItem[]> {
  if (!currentUserId) {
    console.log('❌ No currentUserId set');
    return [];
  }

  console.log('📋 getHistory called - currentUserId:', currentUserId);

  try {
    const response = await fetch(`/api/history?userId=${currentUserId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Fetched', data.redesigns?.length || 0, 'redesigns from API');

    // Transform to HydratedHistoryItem format
    return (data.redesigns || []).map((item: any) => ({
      id: item.id,
      originalImageUrl: item.originalImageUrl,
      redesignedImageUrl: item.redesignedImageUrl,
      designCatalog: item.designCatalog,
      styles: typeof item.styles === 'string' ? JSON.parse(item.styles) : item.styles,
      climateZone: item.climateZone,
      isPinned: item.isPinned,
      timestamp: item.createdAt,
    }));
  } catch (error) {
    console.error('❌ Error fetching history from API:', error);
    throw error;
  }
}

export async function saveHistoryItemMetadata(
  originalImage: ImageFile,
  redesignedImage: { base64: string; type: string },
  catalog: DesignCatalog,
  styles: LandscapingStyle[],
  climateZone: string
) {
  if (!currentUserId) {
    throw new Error('No user logged in');
  }

  console.log('💾 Saving history item for user:', currentUserId);

  try {
    // Step 1: Upload images to Cloudinary
    console.log('📤 Uploading images to Cloudinary...');
    const originalUrl = await uploadToCloudinary(originalImage);
    const redesignedUrl = await uploadRedesignedImage(redesignedImage);

    console.log('✅ Images uploaded successfully');

    // Step 2: Save metadata to database via API
    console.log('💾 Saving to database via API...');
    const response = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        originalImageUrl: originalUrl,
        redesignedImageUrl: redesignedUrl,
        catalog,
        styles,
        climateZone,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ History item saved via API');

    return result.redesign;
  } catch (error) {
    console.error('❌ Error saving history item:', error);
    throw error;
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  if (!currentUserId) {
    throw new Error('No user logged in');
  }

  console.log('🗑️ Deleting history item:', id);

  try {
    const response = await fetch(`/api/history/${id}?userId=${currentUserId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ History item deleted via API');
  } catch (error) {
    console.error('❌ Error deleting history item:', error);
    throw error;
  }
}

export async function togglePin(id: string): Promise<HydratedHistoryItem[]> {
  if (!currentUserId) {
    throw new Error('No user logged in');
  }

  console.log('📌 Toggling pin for item:', id);

  try {
    const response = await fetch(`/api/history/${id}/pin?userId=${currentUserId}`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Pin toggled via API');

    // Refresh and return updated history
    return await getHistory();
  } catch (error) {
    console.error('❌ Error toggling pin:', error);
    throw error;
  }
}

export async function checkRedesignLimit(): Promise<{ canRedesign: boolean; remaining: number }> {
  if (!currentUserId) {
    return { canRedesign: false, remaining: 0 };
  }

  console.log('🔍 Checking redesign limit via API');

  try {
    const response = await fetch(`/api/users/redesign-limit?userId=${currentUserId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Limit check result:', data);

    return {
      canRedesign: data.canRedesign,
      remaining: data.remaining,
    };
  } catch (error) {
    console.error('❌ Error checking redesign limit:', error);
    return { canRedesign: false, remaining: 0 };
  }
}
```

### Task 3.2: Update databaseService.ts

Replace database operations with API calls:

```typescript
// src/services/databaseService.ts
// REMOVE these imports:
// import { db } from '../db/index.js';
// import { user } from '../db/schema.js';
// import { eq } from 'drizzle-orm';

export async function ensureUserExists(
  userId: string, 
  email: string, 
  name: string
): Promise<void> {
  console.log('👤 Ensuring user exists via API:', userId);

  try {
    const response = await fetch('/api/users/ensure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, name }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ User ensured via API');
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    throw error;
  }
}
```

---

## Phase 4: Clean Up Frontend Database Files 🧹

### Task 4.1: Move or Remove Database Files from src/

If `src/db/` exists, move it to root level (backend only):

```bash
# Move database files to root for backend use
mv src/db ./db-backend

# Update imports in server.js
# Change: import { db } from './src/db/index.js'
# To: import { db } from './db-backend/index.js'
```

### Task 4.2: Remove Database URL from Frontend Environment

Update `.env` file:

```env
# .env - Backend configuration

# ✅ KEEP - For Express backend
DATABASE_URL=postgresql://your_connection_string

# ❌ REMOVE - Frontend should NOT have database access
# Delete this line:
# VITE_DATABASE_URL=postgresql://...
```

Update `vite-env.d.ts` to remove database URL:

```typescript
// vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  // REMOVE this line:
  // readonly VITE_DATABASE_URL: string
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  // ... other VITE_ variables
}
```

---

## Phase 5: Verification & Testing ✅

### Task 5.1: Search for Remaining Database Imports

```bash
# Run these checks - all should return empty/no results
grep -r "from.*db.*index" src/
grep -r "from.*db/schema" src/
grep -r "drizzle" src/
grep -r "DATABASE_URL" src/
```

### Task 5.2: Build and Check Output

```bash
# Build the frontend
npm run build

# Search for database credentials in build output (should find NOTHING)
grep -r "DATABASE_URL" dist/
grep -r "postgresql://" dist/

# If these return ANY results, the fix is incomplete
```

### Task 5.3: Test All Functionality

Test each feature to ensure it still works via API:

- [ ] Sign in with Clerk
- [ ] Generate a redesign
- [ ] View history page
- [ ] Pin/unpin a design
- [ ] Delete a design
- [ ] Check redesign limit counter
- [ ] Sign out and sign back in

### Task 5.4: Check Browser Console

After testing, verify:
- [ ] No "WARNING: Running SQL directly from the browser" messages
- [ ] No database-related errors
- [ ] API calls show in Network tab (not direct DB queries)
- [ ] No database credentials visible in DevTools

---

## Phase 6: Security Verification 🔒

### Task 6.1: Verify Database Credentials Not Exposed

Open browser DevTools:
1. Go to Network tab
2. Search for "DATABASE" or "postgresql"
3. Should find: **NOTHING**

Open Sources tab:
1. Search all files for "DATABASE_URL"
2. Should find: **NOTHING**

### Task 6.2: Test Unauthorized Access

Try to access API without proper userId:

```bash
# Should return 400 or 401 error
curl http://localhost:3001/api/history

# Should return error (no userId in query)
curl http://localhost:3001/api/history?userId=fake_user_id
```

---

## Success Criteria ✅

The fix is complete when:

1. ✅ No browser warnings about SQL in browser
2. ✅ `grep -r "DATABASE_URL" dist/` returns nothing
3. ✅ All database operations go through Express API
4. ✅ Frontend has no database imports
5. ✅ `VITE_DATABASE_URL` removed from `.env`
6. ✅ All features still work correctly
7. ✅ Browser DevTools shows API calls, not direct DB queries
8. ✅ Database credentials not visible in browser

---

## Rollback Plan 🔄

If issues occur:

1. Keep a backup of original files before changes
2. Database operations should fail gracefully with error messages
3. Can temporarily re-enable frontend DB access while debugging
4. Test each endpoint individually before moving to next

---

## Additional Notes

- This is a **CRITICAL security fix** - prioritize above all other work
- Do NOT suppress the warning without fixing the root cause
- Each API endpoint should verify userId matches authenticated session (add Clerk middleware in production)
- Consider adding rate limiting to prevent API abuse
- Log all database operations for security auditing

---

## Expected Timeline

- **Phase 1 (Audit):** 30 minutes
- **Phase 2 (Backend APIs):** 2-3 hours
- **Phase 3 (Frontend Updates):** 2-3 hours
- **Phase 4 (Cleanup):** 30 minutes
- **Phase 5 (Testing):** 1-2 hours
- **Phase 6 (Security Verification):** 30 minutes

**Total:** 6-9 hours for complete implementation and testing

---

## Questions to Ask User

Before starting implementation:
1. Are there any other database operations not mentioned in the audit?
2. Should we add authentication middleware to verify userId matches Clerk session?
3. Do you want rate limiting on the new API endpoints?
4. Should we add request logging for security auditing?