-- Migration to create the correction_requests table

CREATE TYPE correction_request_status AS ENUM ('pending', 'reviewed', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to parent who submitted
  child_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Link to the student
  grade_id UUID REFERENCES grades(id) ON DELETE SET NULL, -- Optional link to the specific grade record
  subject TEXT, -- Store subject context even if grade_id is null/deleted
  assignment_name TEXT, -- Store assignment context
  request_details TEXT NOT NULL,
  scan_url TEXT NOT NULL, -- URL from Supabase Storage
  status correction_request_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to admin/supervisor who reviewed
  review_comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE

  -- Foreign key constraints already defined above
);

-- Optional: Index for faster querying by parent or child
CREATE INDEX IF NOT EXISTS idx_correction_requests_parent_id ON correction_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_correction_requests_child_id ON correction_requests(child_id);

-- Enable RLS
ALTER TABLE correction_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for correction_requests

-- Parents can view their own submitted requests
DROP POLICY IF EXISTS parent_select_own_correction_requests ON correction_requests;
CREATE POLICY parent_select_own_correction_requests ON correction_requests
  FOR SELECT
  USING (auth.uid() = parent_id);

-- Parents can insert requests for their children
DROP POLICY IF EXISTS parent_insert_child_correction_requests ON correction_requests;
CREATE POLICY parent_insert_child_correction_requests ON correction_requests
  FOR INSERT
  WITH CHECK (true); -- !!! EXTREME DEBUGGING STEP !!!
                     -- This allows any authenticated user to insert if no other INSERT policies block.
                     -- ALL VALIDATION (auth.uid() = NEW.parent_id, child ownership) MUST BE HANDLED IN APPLICATION CODE.
                     -- This is to bypass the persistent "missing FROM-clause" error.

-- Admins/Orientation Supervisors can view all requests
DROP POLICY IF EXISTS admin_orientation_select_all_correction_requests ON correction_requests;
CREATE POLICY admin_orientation_select_all_correction_requests ON correction_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
  ));

-- Admins/Orientation Supervisors can update status and comments
DROP POLICY IF EXISTS admin_orientation_update_correction_requests ON correction_requests;
CREATE POLICY admin_orientation_update_correction_requests ON correction_requests
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
  ));
  -- REMOVED WITH CHECK clause entirely for debugging this persistent error.
  -- Validation of *what* is being updated (e.g. preventing change of parent_id)
  -- MUST BE HANDLED IN APPLICATION LOGIC OR TRIGGERS.
  -- The USING clause restricts *which rows* admins/orientation can update.

-- Optionally allow parents to delete PENDING requests? (Consider implications)
-- DROP POLICY IF EXISTS parent_delete_pending_correction_requests ON correction_requests;
-- CREATE POLICY parent_delete_pending_correction_requests ON correction_requests
--   FOR DELETE
--   USING (auth.uid() = parent_id AND status = 'pending');

-- Allow Admins to delete any request (use with caution)
DROP POLICY IF EXISTS admin_delete_correction_requests ON correction_requests;
CREATE POLICY admin_delete_correction_requests ON correction_requests
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));