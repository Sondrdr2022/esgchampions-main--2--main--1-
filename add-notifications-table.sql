-- Add notifications table for champion notifications
-- Run this in Supabase SQL Editor

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  champion_id UUID NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('review_accepted', 'review_rejected', 'review_pending')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_champion_id ON notifications(champion_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = champion_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE 
  USING (auth.uid() = champion_id)
  WITH CHECK (auth.uid() = champion_id);

-- Function: Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_champion_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_review_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (champion_id, type, title, message, review_id)
  VALUES (p_champion_id, p_type, p_title, p_message, p_review_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing functions if they exist (to allow return type changes)
DROP FUNCTION IF EXISTS accept_review(UUID, UUID);
DROP FUNCTION IF EXISTS delete_review(UUID, UUID, TEXT);

-- Update accept_review function to create notification
CREATE OR REPLACE FUNCTION accept_review(
  p_review_id UUID,
  p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_accepted_id UUID;
  v_review_data RECORD;
  v_panel_id TEXT;
  v_indicator_title TEXT;
  v_panel_title TEXT;
BEGIN
  -- Get review data with indicator and panel information
  SELECT 
    r.*,
    i.title as indicator_title,
    i.panel_id,
    p.title as panel_title
  INTO v_review_data
  FROM reviews r
  JOIN indicators i ON i.id = r.indicator_id
  JOIN panels p ON p.id = i.panel_id
  WHERE r.id = p_review_id AND r.status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found or already processed';
  END IF;
  
  -- Extract values from the record
  v_panel_id := v_review_data.panel_id;
  v_indicator_title := v_review_data.indicator_title;
  v_panel_title := v_review_data.panel_title;
  
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
  SET status = 'accepted',
      updated_at = NOW()
  WHERE id = p_review_id;
  
  -- Record admin action
  INSERT INTO admin_actions (admin_id, review_id, action)
  VALUES (p_admin_id, p_review_id, 'accept');
  
  -- Create notification for champion
  PERFORM create_notification(
    v_review_data.champion_id,
    'review_accepted',
    'Review Accepted',
    'Your review for "' || v_indicator_title || '" in panel "' || v_panel_title || '" has been accepted and added to the rankings.',
    p_review_id
  );
  
  RETURN v_accepted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update delete_review function to create notification
CREATE OR REPLACE FUNCTION delete_review(
  p_review_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_review_data RECORD;
  v_indicator_title TEXT;
  v_panel_title TEXT;
BEGIN
  -- Get review data with indicator and panel information
  SELECT 
    r.*,
    i.title as indicator_title,
    i.panel_id,
    p.title as panel_title
  INTO v_review_data
  FROM reviews r
  JOIN indicators i ON i.id = r.indicator_id
  JOIN panels p ON p.id = i.panel_id
  WHERE r.id = p_review_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
  
  -- Extract values from the record
  v_indicator_title := v_review_data.indicator_title;
  v_panel_title := v_review_data.panel_title;
  
  -- Record admin action before deletion
  INSERT INTO admin_actions (admin_id, review_id, action, notes)
  VALUES (p_admin_id, p_review_id, 'delete', p_notes);
  
  -- Create notification for champion before deletion
  PERFORM create_notification(
    v_review_data.champion_id,
    'review_rejected',
    'Review Rejected',
    'Your review for "' || v_indicator_title || '" in panel "' || v_panel_title || '" has been rejected and removed.' || 
    CASE WHEN p_notes IS NOT NULL THEN ' Reason: ' || p_notes ELSE '' END,
    p_review_id
  );
  
  -- Delete the review (permanently remove)
  DELETE FROM reviews WHERE id = p_review_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
