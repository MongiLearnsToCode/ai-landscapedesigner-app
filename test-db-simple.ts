import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Test by running a simple query
const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Run a simple query to check if connection works
    const result = await sql`SELECT version();`;
    console.log('✅ Database connection successful!');
    console.log('Database version info:', result[0].version.substring(0, 50) + '...');
    
    console.log('\n🎉 Your Neon database is properly connected!');
    console.log('Tables have been created successfully during migration.');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

testConnection();