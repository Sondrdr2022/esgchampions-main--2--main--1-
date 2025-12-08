-- ============================================
-- COMPLETE DATABASE SCHEMA FOR STIF ESG PLATFORM
-- ============================================
-- This script creates the entire database from scratch
-- Run this in Supabase SQL Editor after deleting all tables
--
-- Features included:
-- - User authentication and profiles (champions)
-- - Champion registration with all fields
-- - Legal agreements and digital signatures tracking
-- - Terms acceptance records
-- - ESG panels and indicators
-- - Project submissions (reviews)
-- - Votes and comments on indicators
-- - Admin review system
-- - Invitations system
-- - Proper RLS policies for all operations
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CHAMPIONS TABLE (User Profiles)
-- ============================================
-- Stores champion profile data linked to Supabase Auth users
CREATE TABLE champions (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  organization TEXT,
  role TEXT,
  
  -- Contact Information
  mobile TEXT,
  office_phone TEXT,
  linkedin TEXT,
  website TEXT,
  
  -- Professional Information
  competence TEXT, -- 'beginner', 'intermediate', 'advanced', 'expert'
  contributions TEXT,
  primary_sector TEXT,
  expertise_panels TEXT, -- JSON array or comma-separated values
  
  -- Legal Agreements and Signatures
  cla_accepted BOOLEAN DEFAULT false,
  nda_accepted BOOLEAN DEFAULT false,
  nda_signature TEXT, -- Digital signature for NDA
  terms_accepted BOOLEAN DEFAULT false,
  ip_policy_accepted BOOLEAN DEFAULT false,
  
  -- Admin Flag
  is_admin BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for champions
CREATE INDEX idx_champions_email ON champions(email);
CREATE INDEX idx_champions_is_admin ON champions(is_admin);
CREATE INDEX idx_champions_created_at ON champions(created_at DESC);

-- ============================================
-- 2. PANELS TABLE (ESG Panel Categories)
-- ============================================
CREATE TABLE panels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('environmental', 'social', 'governance')),
  description TEXT,
  purpose TEXT,
  key_indicators TEXT,
  frameworks TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for panels
CREATE INDEX idx_panels_category ON panels(category);

-- ============================================
-- 3. INDICATORS TABLE (ESG Indicators)
-- ============================================
CREATE TABLE indicators (
  id TEXT PRIMARY KEY,
  panel_id TEXT NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  formula_required BOOLEAN DEFAULT false,
  unit TEXT,
  frameworks TEXT,
  sector_context TEXT,
  validation_question TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for indicators
CREATE INDEX idx_indicators_panel_id ON indicators(panel_id);

-- ============================================
-- 4. VOTES TABLE (Champion Votes on Indicators)
-- ============================================
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  champion_id UUID NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
  indicator_id TEXT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(champion_id, indicator_id) -- One vote per champion per indicator
);

-- Indexes for votes
CREATE INDEX idx_votes_champion_id ON votes(champion_id);
CREATE INDEX idx_votes_indicator_id ON votes(indicator_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);

-- ============================================
-- 5. COMMENTS TABLE (Champion Comments on Indicators)
-- ============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  champion_id UUID NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
  indicator_id TEXT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for comments
CREATE INDEX idx_comments_champion_id ON comments(champion_id);
CREATE INDEX idx_comments_indicator_id ON comments(indicator_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- ============================================
-- 6. REVIEWS TABLE (Project Submissions / Indicator Reviews)
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  champion_id UUID NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
  indicator_id TEXT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  
  -- Review Data
  necessary TEXT CHECK (necessary IN ('yes', 'no', 'not-sure')),
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  comments TEXT,
  
  -- Status (for admin review)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'deleted')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(champion_id, indicator_id) -- One review per champion per indicator
);

-- Indexes for reviews
CREATE INDEX idx_reviews_champion_id ON reviews(champion_id);
CREATE INDEX idx_reviews_indicator_id ON reviews(indicator_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================
-- 7. ACCEPTED REVIEWS TABLE (Approved Reviews for Rankings)
-- ============================================
CREATE TABLE accepted_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  champion_id UUID NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
  indicator_id TEXT NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  panel_id TEXT NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  
  -- Review Data
  necessary TEXT,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  comments TEXT,
  
  -- Admin Tracking
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  UNIQUE(review_id)
);

-- Indexes for accepted_reviews
CREATE INDEX idx_accepted_reviews_indicator_id ON accepted_reviews(indicator_id);
CREATE INDEX idx_accepted_reviews_panel_id ON accepted_reviews(panel_id);
CREATE INDEX idx_accepted_reviews_champion_id ON accepted_reviews(champion_id);
CREATE INDEX idx_accepted_reviews_accepted_at ON accepted_reviews(accepted_at DESC);

-- ============================================
-- 8. ADMIN ACTIONS TABLE (Admin Review Tracking)
-- ============================================
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('accept', 'delete')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for admin_actions
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_review_id ON admin_actions(review_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- ============================================
-- 9. INVITATIONS TABLE (Panel Invitations)
-- ============================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_champion_id UUID NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  panel_id TEXT NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for invitations
CREATE INDEX idx_invitations_to_email ON invitations(to_email);
CREATE INDEX idx_invitations_panel_id ON invitations(panel_id);
CREATE INDEX idx_invitations_from_champion_id ON invitations(from_champion_id);
CREATE INDEX idx_invitations_status ON invitations(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE accepted_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CHAMPIONS POLICIES
-- ============================================

-- Policy: Anyone can read champion profiles (for rankings, etc.)
CREATE POLICY "Champions are viewable by everyone" ON champions
  FOR SELECT USING (true);

-- Policy: Users can insert their own profile (CRITICAL FOR REGISTRATION)
-- This allows registration when the inserted id matches auth.uid()
CREATE POLICY "Users can insert own profile" ON champions
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON champions
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- PANELS POLICIES
-- ============================================

-- Policy: All authenticated users can read panels
CREATE POLICY "Panels are viewable by authenticated users" ON panels
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- INDICATORS POLICIES
-- ============================================

-- Policy: All authenticated users can read indicators
CREATE POLICY "Indicators are viewable by authenticated users" ON indicators
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- VOTES POLICIES
-- ============================================

-- Policy: Anyone can read votes (for display purposes)
CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

-- Policy: Users can insert their own votes
CREATE POLICY "Users can insert own votes" ON votes
  FOR INSERT WITH CHECK (auth.uid() = champion_id);

-- Policy: Users can update their own votes
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE 
  USING (auth.uid() = champion_id)
  WITH CHECK (auth.uid() = champion_id);

-- Policy: Users can delete their own votes
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE USING (auth.uid() = champion_id);

-- ============================================
-- COMMENTS POLICIES
-- ============================================

-- Policy: Anyone can read comments
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

-- Policy: Users can insert their own comments
CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = champion_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE 
  USING (auth.uid() = champion_id)
  WITH CHECK (auth.uid() = champion_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = champion_id);

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- Policy: Anyone can read reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- Policy: Users can insert their own reviews
CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = champion_id);

-- Policy: Users can update their own reviews (only if pending)
CREATE POLICY "Users can update own pending reviews" ON reviews
  FOR UPDATE 
  USING (auth.uid() = champion_id AND status = 'pending')
  WITH CHECK (auth.uid() = champion_id);

-- ============================================
-- ACCEPTED REVIEWS POLICIES
-- ============================================

-- Policy: Anyone can read accepted reviews (for rankings)
CREATE POLICY "Accepted reviews are viewable by everyone" ON accepted_reviews
  FOR SELECT USING (true);

-- Policy: Only admins can insert accepted reviews
CREATE POLICY "Only admins can insert accepted reviews" ON accepted_reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM champions 
      WHERE champions.id = auth.uid() 
      AND champions.is_admin = true
    )
  );

-- ============================================
-- ADMIN ACTIONS POLICIES
-- ============================================

-- Policy: Only admins can view admin actions
CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM champions 
      WHERE champions.id = auth.uid() 
      AND champions.is_admin = true
    )
  );

-- Policy: Only admins can insert admin actions
CREATE POLICY "Admins can insert admin actions" ON admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM champions 
      WHERE champions.id = auth.uid() 
      AND champions.is_admin = true
    )
  );

-- ============================================
-- INVITATIONS POLICIES
-- ============================================

-- Policy: Users can view invitations sent to their email or sent by them
CREATE POLICY "Users can view own invitations" ON invitations
  FOR SELECT USING (
    auth.uid() = from_champion_id OR 
    to_email = (SELECT email FROM champions WHERE id = auth.uid())
  );

-- Policy: Users can insert invitations (as sender)
CREATE POLICY "Users can insert invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid() = from_champion_id);

-- Policy: Users can update invitations they sent
CREATE POLICY "Users can update own invitations" ON invitations
  FOR UPDATE 
  USING (auth.uid() = from_champion_id)
  WITH CHECK (auth.uid() = from_champion_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers: Auto-update updated_at on all tables
CREATE TRIGGER update_champions_updated_at BEFORE UPDATE ON champions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_panels_updated_at BEFORE UPDATE ON panels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicators_updated_at BEFORE UPDATE ON indicators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Accept a review (moves to accepted_reviews)
CREATE OR REPLACE FUNCTION accept_review(
  p_review_id UUID,
  p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_accepted_id UUID;
  v_review_data RECORD;
  v_panel_id TEXT;
BEGIN
  -- Get review data
  SELECT * INTO v_review_data
  FROM reviews
  WHERE id = p_review_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found or already processed';
  END IF;
  
  -- Get panel_id from indicator
  SELECT panel_id INTO v_panel_id
  FROM indicators
  WHERE id = v_review_data.indicator_id;
  
  IF v_panel_id IS NULL THEN
    RAISE EXCEPTION 'Panel not found for indicator';
  END IF;
  
  -- Insert into accepted_reviews
  INSERT INTO accepted_reviews (
    review_id,
    champion_id,
    indicator_id,
    panel_id,
    necessary,
    rating,
    comments,
    accepted_by
  ) VALUES (
    p_review_id,
    v_review_data.champion_id,
    v_review_data.indicator_id,
    v_panel_id,
    v_review_data.necessary,
    v_review_data.rating,
    v_review_data.comments,
    p_admin_id
  )
  RETURNING id INTO v_accepted_id;
  
  -- Update review status
  UPDATE reviews
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_review_id;
  
  -- Log admin action
  INSERT INTO admin_actions (admin_id, review_id, action, notes)
  VALUES (p_admin_id, p_review_id, 'accept', 'Review accepted and added to rankings');
  
  RETURN v_accepted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete a review (marks as deleted)
CREATE OR REPLACE FUNCTION delete_review(
  p_review_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Check if review exists and is pending
  IF NOT EXISTS (
    SELECT 1 FROM reviews WHERE id = p_review_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Review not found or already processed';
  END IF;
  
  -- Update review status
  UPDATE reviews
  SET status = 'deleted', updated_at = NOW()
  WHERE id = p_review_id;
  
  -- Log admin action
  INSERT INTO admin_actions (admin_id, review_id, action, notes)
  VALUES (p_admin_id, p_review_id, 'delete', COALESCE(p_notes, 'Review deleted by admin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify all tables were created
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'champions', 'panels', 'indicators', 'votes', 
    'comments', 'reviews', 'accepted_reviews', 
    'admin_actions', 'invitations'
  )
ORDER BY tablename;

-- Verify all RLS policies were created
SELECT 
  tablename,
  policyname,
  cmd as "Command",
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'champions', 'panels', 'indicators', 'votes', 
    'comments', 'reviews', 'accepted_reviews', 
    'admin_actions', 'invitations'
  )
ORDER BY tablename, cmd, policyname;

-- ============================================
-- COMPLETE SETUP SUCCESS MESSAGE
-- ============================================

SELECT '✅ Database schema created successfully! 
  - All tables created
  - All RLS policies configured
  - All indexes created
  - All functions and triggers set up
  - Ready for use!' AS status;

