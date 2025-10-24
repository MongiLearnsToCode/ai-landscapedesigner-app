import { db } from '../db/client';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function is adapted from services/databaseService.ts
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
    // await syncUserSubscription(userId, email); // This is commented out for now to avoid complexity
   } catch (error) {
     console.error('Error ensuring user exists:', error);
     throw error;
   }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('DB URL exists:', !!process.env.DATABASE_URL);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, email, name } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'userId and email are required' });
  }

  try {
    await ensureUserExists(userId, email, name);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('API error in ensureUser:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
