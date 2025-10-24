import { db } from '../db/client';
import { landscapeRedesigns, user } from '../db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { uploadImageToCloudinary } from './cloudinaryService';
import type { ImageFile, DesignCatalog, LandscapingStyle } from '../types';

const MAX_REDESIGNS = 3;

export interface SaveRedesignData {
  originalImage: ImageFile;
  redesignedImage: { base64: string; type: string };
  catalog: DesignCatalog;
  styles: LandscapingStyle[];
  climateZone: string;
  userId: string;
}

export interface RedesignRecord {
  id: string;
  userId: string;
  originalImageUrl: string;
  redesignedImageUrl: string;
  designCatalog: DesignCatalog;
  styles: LandscapingStyle[];
  climateZone: string | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ensureUserExists = async (userId: string, email: string, name: string): Promise<void> => {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);

    if (existingUser.length === 0) {
      // Create new user
      await db.insert(user).values({
        id: userId,
        name: name || 'User',
        email: email,
        emailVerified: true, // Clerk handles verification
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created new user in database:', userId);
    } else {
      // Update existing user with latest info from Clerk
      await db.update(user)
        .set({
          name: name || 'User',
          email: email,
          updatedAt: new Date()
        })
        .where(eq(user.id, userId));
      console.log('✅ Updated existing user in database:', userId);
    }

    // Sync subscription status with Polar
    await syncUserSubscription(userId, email);
  } catch (error) {
    console.error('Error ensuring user exists:', error);
  }
};

// Sync user subscription status with Polar
export const syncUserSubscription = async (userId: string, email: string): Promise<void> => {
  try {
    const { polarService } = await import('./polarService');

    // Get user from database
    const [existingUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!existingUser) return;

    // If user has a Polar customer ID, fetch their subscriptions
    if (existingUser.polarCustomerId) {
      const subscriptions = await polarService.listCustomerSubscriptions(existingUser.polarCustomerId);

      // Find the active subscription (assuming one active per customer)
      const activeSubscription = subscriptions.find(sub =>
        ['active', 'trialing'].includes(sub.status)
      );

      if (activeSubscription) {
        await db.update(user)
          .set({
            subscriptionId: activeSubscription.id,
            subscriptionPlan: mapPolarPriceToPlan(activeSubscription.priceId),
            subscriptionStatus: activeSubscription.status,
            subscriptionCurrentPeriodStart: new Date(activeSubscription.currentPeriodStart),
            subscriptionCurrentPeriodEnd: new Date(activeSubscription.currentPeriodEnd),
            subscriptionCancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
            updatedAt: new Date()
          })
          .where(eq(user.id, userId));

        console.log('✅ Synced subscription for user:', userId);
      }
    }
  } catch (error) {
    console.error('Error syncing user subscription:', error);
    // Don't fail the login if subscription sync fails
  }
};

// Map Polar price ID to plan name (helper function)
function mapPolarPriceToPlan(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.VITE_POLAR_PRICE_PERSONAL_MONTHLY || '']: 'Personal',
    [process.env.VITE_POLAR_PRICE_CREATOR_MONTHLY || '']: 'Creator',
    [process.env.VITE_POLAR_PRICE_BUSINESS_MONTHLY || '']: 'Business',
    [process.env.VITE_POLAR_PRICE_PERSONAL_ANNUAL || '']: 'Personal',
    [process.env.VITE_POLAR_PRICE_CREATOR_ANNUAL || '']: 'Creator',
    [process.env.VITE_POLAR_PRICE_BUSINESS_ANNUAL || '']: 'Business',
  };

  return priceMap[priceId] || 'Free';
}

export const checkRedesignLimit = async (userId: string): Promise<{ canRedesign: boolean; remaining: number }> => {
  if (!userId) {
    return { canRedesign: false, remaining: 0 };
  }
  
  try {
    const [result] = await db
      .select({ count: count() })
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.userId, userId));
    
    const userCount = result?.count || 0;
    const remaining = MAX_REDESIGNS - userCount;
    
    return { canRedesign: remaining > 0, remaining: Math.max(0, remaining) };
  } catch (error) {
    console.error('Error checking redesign limit:', error);
    return { canRedesign: false, remaining: 0 };
  }
};

export const saveRedesign = async (data: SaveRedesignData): Promise<RedesignRecord> => {
  console.log('🔧 Starting saveRedesign for user:', data.userId);

  // Check limit first
  const { canRedesign } = await checkRedesignLimit(data.userId);
  if (!canRedesign) {
    throw new Error('Maximum redesign limit reached (3 redesigns per user)');
  }

  try {
    // Upload images to Cloudinary
    console.log('📤 Uploading images to Cloudinary...');
    const [originalUpload, redesignedUpload] = await Promise.all([
      uploadImageToCloudinary(data.originalImage),
      uploadImageToCloudinary({
        base64: data.redesignedImage.base64,
        type: data.redesignedImage.type,
        name: `redesigned_${Date.now()}`
      })
    ]);

    console.log('✅ Images uploaded:', {
      original: originalUpload.public_id,
      redesigned: redesignedUpload.public_id
    });

    const id = `redesign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('💾 Saving to database with ID:', id);
    const [result] = await db.insert(landscapeRedesigns).values({
      id,
      userId: data.userId,
      originalImageUrl: originalUpload.secure_url,
      redesignedImageUrl: redesignedUpload.secure_url,
      designCatalog: data.catalog,
      styles: data.styles,
      climateZone: data.climateZone,
      isPinned: false
    }).returning();

    console.log('✅ Database save successful:', result.id);
    return result as RedesignRecord;
  } catch (error) {
    console.error('❌ saveRedesign error:', error);
    throw error;
  }
};

export const getRedesigns = async (userId: string): Promise<RedesignRecord[]> => {
  if (!userId) return [];

  console.log('🔍 Fetching redesigns for user:', userId);

  try {
    // Select only necessary fields, exclude sensitive data like userId from responses
    const results = await db
      .select({
        id: landscapeRedesigns.id,
        userId: landscapeRedesigns.userId, // Keep for internal logic but don't expose in responses
        originalImageUrl: landscapeRedesigns.originalImageUrl,
        redesignedImageUrl: landscapeRedesigns.redesignedImageUrl,
        designCatalog: landscapeRedesigns.designCatalog,
        styles: landscapeRedesigns.styles,
        climateZone: landscapeRedesigns.climateZone,
        isPinned: landscapeRedesigns.isPinned,
        createdAt: landscapeRedesigns.createdAt,
        // Exclude updatedAt as it's not needed for UI
      })
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.userId, userId))
      .orderBy(desc(landscapeRedesigns.isPinned), desc(landscapeRedesigns.createdAt));

    console.log('✅ Found redesigns:', results.length);
    return results as RedesignRecord[];
  } catch (error) {
    console.error('❌ getRedesigns error:', error);
    throw error;
  }
};

export const togglePin = async (id: string): Promise<void> => {
  console.log('📌 Toggling pin for ID:', id);
  
  try {
    const [current] = await db
      .select({ isPinned: landscapeRedesigns.isPinned })
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.id, id));

    await db
      .update(landscapeRedesigns)
      .set({ isPinned: !current.isPinned, updatedAt: new Date() })
      .where(eq(landscapeRedesigns.id, id));
      
    console.log('✅ Pin toggled successfully');
  } catch (error) {
    console.error('❌ togglePin error:', error);
    throw error;
  }
};

export const deleteRedesign = async (id: string): Promise<void> => {
  console.log('🗑️ Deleting redesign:', id);
  
  try {
    await db.delete(landscapeRedesigns).where(eq(landscapeRedesigns.id, id));
    console.log('✅ Delete successful');
  } catch (error) {
    console.error('❌ deleteRedesign error:', error);
    throw error;
  }
};
