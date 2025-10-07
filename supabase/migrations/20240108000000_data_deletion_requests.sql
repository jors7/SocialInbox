-- Create data_deletion_requests table for GDPR compliance
-- This table tracks data deletion requests from Facebook/Meta

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_user_id TEXT NOT NULL,
  confirmation_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_facebook_user_id
  ON data_deletion_requests(facebook_user_id);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_confirmation_code
  ON data_deletion_requests(confirmation_code);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status
  ON data_deletion_requests(status);

-- Enable RLS (Row Level Security)
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Admin users can view deletion requests
-- You may want to adjust this policy based on your team/admin setup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'data_deletion_requests'
    AND policyname = 'Admin users can view deletion requests'
  ) THEN
    CREATE POLICY "Admin users can view deletion requests"
      ON data_deletion_requests
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members tm
          JOIN teams t ON t.id = tm.team_id
          WHERE tm.user_id = auth.uid()
          AND tm.role = 'admin'
        )
      );
  END IF;
END $$;

-- Add updated_at trigger
CREATE TRIGGER set_data_deletion_requests_updated_at
  BEFORE UPDATE ON data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE data_deletion_requests IS 'Tracks data deletion requests from Facebook/Meta for GDPR compliance';
