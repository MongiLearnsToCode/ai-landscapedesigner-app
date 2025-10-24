import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Use environment variable
const databaseUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or VITE_DATABASE_URL environment variable is not configured');
}

export const sql = neon(databaseUrl);
export const db = drizzle(sql, {
  schema,
  logger: false
});
