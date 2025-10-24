import { sql } from './db/client';

async function runMigration() {
  try {
    console.log('Adding subscription columns to user table...');

    await sql`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "subscription_id" text,
      ADD COLUMN IF NOT EXISTS "subscription_plan" text DEFAULT 'Free',
      ADD COLUMN IF NOT EXISTS "subscription_status" text DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS "subscription_current_period_start" timestamp,
      ADD COLUMN IF NOT EXISTS "subscription_current_period_end" timestamp,
      ADD COLUMN IF NOT EXISTS "subscription_cancel_at_period_end" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "polar_customer_id" text
    `;

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();