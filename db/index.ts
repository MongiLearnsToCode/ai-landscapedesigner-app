import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { landscapeRedesigns } from './schema';

const databaseUrl = process.env.VITE_DATABASE_URL || 'postgresql://neondb_owner:npg_qKuo7yMf5Agz@ep-rapid-silence-adndnbjv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema: { landscapeRedesigns } });
