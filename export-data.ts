import { db } from './db/client';
import { landscapeRedesigns, user } from './db/schema';

async function exportData() {
  console.log('Exporting users...');
  const users = await db.select({
    clerkUserId: user.id,
    email: user.email,
    name: user.name,
  }).from(user);

  console.log('Exporting redesigns...');
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

  // Now call the Convex migration
  const { ConvexHttpClient } = await import('convex/browser');
  const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

  await client.mutation('migrate:migrateFromNeon', {
    users,
    redesigns,
  });

  console.log('Migration completed!');
}

exportData().catch(console.error);