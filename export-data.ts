import 'dotenv/config';
import { db } from './db/client';
import { landscapeRedesigns, user } from './db/schema';
import { ConvexHttpClient } from 'convex/browser';
import { api } from './convex/_generated/api';

async function exportData() {
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error('CONVEX_URL environment variable is required');
  }

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
    createdAt: landscapeRedesigns.createdAt,
  }).from(landscapeRedesigns);

  console.log(`Found ${users.length} users and ${redesigns.length} redesigns`);

  // Call the Convex migration using npx convex run
  const { spawn } = await import('child_process');

  // Process in batches to avoid timeouts
  const BATCH_SIZE = 100;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const userBatch = users.slice(i, i + BATCH_SIZE);
    console.log(`Migrating users batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
    await runConvexCommand('migrate:migrateFromNeon', { users: userBatch, redesigns: [] });
  }

  for (let i = 0; i < redesigns.length; i += BATCH_SIZE) {
    const redesignBatch = redesigns.slice(i, i + BATCH_SIZE);
    console.log(`Migrating redesigns batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
    await runConvexCommand('migrate:migrateFromNeon', { users: [], redesigns: redesignBatch });
  }

  async function runConvexCommand(functionName: string, args: any) {
    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['convex', 'run', functionName, '--args', JSON.stringify(args)], {
        stdio: 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          reject(new Error(`Convex command failed with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  console.log('Migration completed!');
}

exportData().catch(console.error);