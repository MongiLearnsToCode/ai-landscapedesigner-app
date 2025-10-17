import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from './db';

async function runMigration() {
  try {
    console.log('Running migration...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
