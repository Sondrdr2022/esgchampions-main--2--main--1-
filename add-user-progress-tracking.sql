-- Add user progress tracking columns to champions table
-- Tracks last active panel and indicator for "Continue where you left off" functionality

ALTER TABLE champions 
ADD COLUMN IF NOT EXISTS last_active_panel_id TEXT REFERENCES panels(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_active_indicator_id TEXT REFERENCES indicators(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_champions_last_activity ON champions(last_activity_at DESC);

-- Add comments
COMMENT ON COLUMN champions.last_active_panel_id IS 'Last panel the user was working on';
COMMENT ON COLUMN champions.last_active_indicator_id IS 'Last indicator the user was reviewing';
COMMENT ON COLUMN champions.last_activity_at IS 'Timestamp of last activity';
