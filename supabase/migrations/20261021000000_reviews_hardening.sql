-- Migration: 20261021000000_reviews_hardening.sql
-- Description: Hardens chemora_reviews schema and RLS policies, adds review_votes table, and enforces status workflow.
-- NOTE: DO NOT EXECUTE DIRECTLY AGAINST LIVE DATABASE. Review and apply via Supabase CLI or Dashboard.

BEGIN;

-- 1. Ensure user_id column exists on chemora_reviews with foreign key cascade to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chemora_reviews' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE chemora_reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Ensure status column exists with check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chemora_reviews' AND column_name = 'status'
  ) THEN
    ALTER TABLE chemora_reviews ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 3. Enforce one review per user via unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_chemora_reviews_user_id ON chemora_reviews (user_id) WHERE user_id IS NOT NULL;

-- 4. Create review_votes table to record helpful votes
CREATE TABLE IF NOT EXISTS review_votes (
  review_id TEXT NOT NULL REFERENCES chemora_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (review_id, user_id)
);

-- Index for speedy aggregate counts per review
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes (review_id);

-- 5. Enable Row-Level Security (RLS) on both tables
ALTER TABLE chemora_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- 6. Drop any legacy wide-open policies on chemora_reviews
DROP POLICY IF EXISTS "Public reviews are viewable by everyone" ON chemora_reviews;
DROP POLICY IF EXISTS "Allow public read" ON chemora_reviews;
DROP POLICY IF EXISTS "Allow anonymous insert" ON chemora_reviews;
DROP POLICY IF EXISTS "Allow authenticated insert" ON chemora_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON chemora_reviews;
DROP POLICY IF EXISTS "No client writes to reviews" ON chemora_reviews;

-- 7. Define strict read-only policy on chemora_reviews: public can only select approved reviews
CREATE POLICY "Public can view approved reviews"
  ON chemora_reviews
  FOR SELECT
  TO public
  USING (status = 'approved');

-- 8. Disallow direct client INSERT/UPDATE/DELETE on chemora_reviews (all writes through backend service-role admin)
-- Since RLS is enabled and no INSERT/UPDATE/DELETE policies exist for anon/authenticated roles, client writes are denied by default.

-- 9. Deny all client access to review_votes (all voting managed via server service-role admin)
DROP POLICY IF EXISTS "No client select on review_votes" ON review_votes;
DROP POLICY IF EXISTS "No client writes to review_votes" ON review_votes;
-- With RLS enabled on review_votes and no public/authenticated policies granted, direct client access is completely blocked.

COMMIT;
