import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// DATABASE_URL is required; secrets must come from environment/config management
const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, {
  schema,
  logger: false
});
