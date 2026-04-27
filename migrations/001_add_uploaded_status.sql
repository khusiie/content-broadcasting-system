-- Migration: Add 'uploaded' to content status lifecycle
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- Step 1: Drop the existing CHECK constraint on status
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_status_check;

-- Step 2: Add the new CHECK constraint with 'uploaded' status
ALTER TABLE content ADD CONSTRAINT content_status_check 
  CHECK (status IN ('uploaded', 'pending', 'approved', 'rejected'));

-- Step 3: Update default status to 'uploaded'
ALTER TABLE content ALTER COLUMN status SET DEFAULT 'uploaded';

-- Verify
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'content_status_check';
