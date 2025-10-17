import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_qKuo7yMf5Agz@ep-rapid-silence-adndnbjv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

async function updateSchema() {
  try {
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        fingerprint text NOT NULL UNIQUE,
        redesign_count integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `;
    
    console.log('✅ Schema updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateSchema();
