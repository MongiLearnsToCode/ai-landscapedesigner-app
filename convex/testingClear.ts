/**
 * Clear ALL authentication data (for testing only!)
 * 
 * WARNING: This will delete ALL authentication data including:
 * - authAccounts
 * - authSessions  
 * - users table
 * 
 * Only run this in development/testing environments.
 * 
 * Run with: npx convex run testingClear.clearAuthData
 */

import { internalMutation } from "./_generated/server";

export const clearAuthData = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("WARNING: Clearing ALL auth data...");
    
    const results = {
      authAccounts: 0,
      authSessions: 0,
      users: 0,
    };
    
    // Clear authAccounts
    const accounts = await ctx.db.query("authAccounts").collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
      results.authAccounts++;
    }
    
    // Clear authSessions
    const sessions = await ctx.db.query("authSessions").collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
      results.authSessions++;
    }
    
    // Clear users table
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
      results.users++;
    }
    
    console.log("Cleared all auth data:", results);
    
    return results;
  },
});
