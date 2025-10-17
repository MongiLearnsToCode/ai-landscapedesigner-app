import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_qKuo7yMf5Agz@ep-rapid-silence-adndnbjv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

async function cleanAndMigrate() {
  try {
    console.log('Cleaning up existing data...');
    
    // Drop existing tables to start fresh
    await sql`DROP TABLE IF EXISTS landscape_redesigns CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS "session" CASCADE`;
    await sql`DROP TABLE IF EXISTS "account" CASCADE`;
    await sql`DROP TABLE IF EXISTS "verification" CASCADE`;
    await sql`DROP TABLE IF EXISTS "user" CASCADE`;
    
    console.log('Creating Better Auth tables...');
    
    // Create user table
    await sql`
      CREATE TABLE "user" (
        "id" text PRIMARY KEY,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "email_verified" boolean DEFAULT false NOT NULL,
        "image" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    
    // Create session table
    await sql`
      CREATE TABLE "session" (
        "id" text PRIMARY KEY,
        "expires_at" timestamp NOT NULL,
        "token" text NOT NULL UNIQUE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "ip_address" text,
        "user_agent" text,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      )
    `;
    
    // Create account table
    await sql`
      CREATE TABLE "account" (
        "id" text PRIMARY KEY,
        "account_id" text NOT NULL,
        "provider_id" text NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "access_token" text,
        "refresh_token" text,
        "id_token" text,
        "access_token_expires_at" timestamp,
        "refresh_token_expires_at" timestamp,
        "scope" text,
        "password" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    
    // Create verification table
    await sql`
      CREATE TABLE "verification" (
        "id" text PRIMARY KEY,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    
    // Create landscape_redesigns table with proper foreign key
    await sql`
      CREATE TABLE landscape_redesigns (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        original_image_url text NOT NULL,
        redesigned_image_url text NOT NULL,
        design_catalog jsonb NOT NULL,
        styles jsonb NOT NULL,
        climate_zone text,
        is_pinned boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `;
    
    console.log('✅ Database migrated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanAndMigrate();
