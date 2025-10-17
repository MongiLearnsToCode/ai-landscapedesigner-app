import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, images, landscapeRedesigns, sessions } from './backend/src/db/schema';

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Test by querying the users table (should be empty)
const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Try to query the users table
    const usersResult = await db.select().from(users).limit(1);
    console.log('✅ Database connection successful!');
    console.log('✅ Users table exists and is accessible');
    console.log('Sample query result (should be empty array):', usersResult);
    
    // Check if other tables exist by trying to access them
    const imagesResult = await db.select().from(images).limit(1);
    console.log('✅ Images table exists and is accessible');
    
    const redesignsResult = await db.select().from(landscapeRedesigns).limit(1);
    console.log('✅ Landscape redesigns table exists and is accessible');
    
    const sessionsResult = await db.select().from(sessions).limit(1);
    console.log('✅ Sessions table exists and is accessible');
    
    console.log('\n🎉 All tables have been successfully created in your Neon database!');
    console.log('You can now use the API endpoints to interact with your database.');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

testConnection();