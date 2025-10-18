-- Remove foreign key constraint to allow Clerk user IDs
ALTER TABLE landscape_redesigns DROP CONSTRAINT IF EXISTS landscape_redesigns_user_id_fkey;
