import { db } from '../db/client';
import { landscapeRedesigns, users } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { uploadImageToCloudinary } from './cloudinaryService';
import { getDeviceFingerprint } from './fingerprintService';
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

export const checkRedesignLimit = async (): Promise<{ canRedesign: boolean; remaining: number }> => {
  const fingerprint = getDeviceFingerprint();
  
  try {
    const [user] = await db.select().from(users).where(eq(users.fingerprint, fingerprint));
    
    if (!user) {
      return { canRedesign: true, remaining: MAX_REDESIGNS };
    }
    
    const remaining = MAX_REDESIGNS - user.redesignCount;
    return { canRedesign: remaining > 0, remaining: Math.max(0, remaining) };
  } catch (error) {
    console.error('Error checking redesign limit:', error);
    return { canRedesign: false, remaining: 0 };
  }
};

export const saveRedesign = async (data: SaveRedesignData): Promise<RedesignRecord> => {
  const fingerprint = getDeviceFingerprint();
  
  // Check limit first
  const { canRedesign } = await checkRedesignLimit();
  if (!canRedesign) {
    throw new Error('Maximum redesign limit reached (3 redesigns per device)');
  }

  console.log('🔧 Starting saveRedesign with data:', { 
    userId: data.userId, 
    styles: data.styles, 
    climateZone: data.climateZone 
  });

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

    // Create or update user and increment count
    const fingerprint = getDeviceFingerprint();
    await db.insert(users).values({
      id: fingerprint,
      fingerprint,
      redesignCount: 1
    }).onConflictDoUpdate({
      target: users.fingerprint,
      set: {
        redesignCount: sql`${users.redesignCount} + 1`,
        updatedAt: new Date()
      }
    });

    console.log('💾 Saving to database with ID:', id);
    const [result] = await db.insert(landscapeRedesigns).values({
      id,
      userId: fingerprint, // Use fingerprint as userId
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

export const getRedesigns = async (userId?: string): Promise<RedesignRecord[]> => {
  const fingerprint = getDeviceFingerprint();
  const actualUserId = userId || fingerprint;
  
  console.log('🔍 Fetching redesigns for user:', actualUserId);
  
  try {
    const results = await db
      .select()
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.userId, actualUserId))
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
