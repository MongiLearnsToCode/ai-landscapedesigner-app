import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { landscapeRedesigns } from './schema';

// Use environment variable for browser
const databaseUrl = import.meta.env.VITE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('VITE_DATABASE_URL is not configured');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema: { landscapeRedesigns } });
