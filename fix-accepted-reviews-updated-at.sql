-- Fix: Add updated_at column to accepted_reviews table
-- This fixes the error: column "updated_at" of relation "accepted_reviews" does not exist

ALTER TABLE accepted_reviews 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a trigger to automatically update updated_at on row updates
CREATE OR REPLACE FUNCTION update_accepted_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_update_accepted_reviews_updated_at ON accepted_reviews;

CREATE TRIGGER trigger_update_accepted_reviews_updated_at
  BEFORE UPDATE ON accepted_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_accepted_reviews_updated_at();

-- Success message
SELECT '✅ Fixed: added updated_at column to accepted_reviews table' AS status;

