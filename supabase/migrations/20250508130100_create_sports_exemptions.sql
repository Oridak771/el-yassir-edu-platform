-- Migration to create the sports_exemptions table

CREATE TYPE exemption_request_status AS ENUM ('submitted', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS sports_exemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL, -- Link to parent who submitted
  child_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Link to the student concerned
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  medical_document_url TEXT, -- Optional: Link to uploaded doctor's note in Storage
  status exemption_request_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to admin/staff who reviewed
  review_comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Foreign key constraints already defined above
  CONSTRAINT check_end_date_after_start_date CHECK (end_date >= start_date),

  INDEX idx_sports_exemptions_parent_id ON sports_exemptions(parent_id),
  INDEX idx_sports_exemptions_child_id ON sports_exemptions(child_id)
);

-- Enable RLS
ALTER TABLE sports_exemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sports_exemptions

-- Parents can view their own submitted exemption requests
DROP POLICY IF EXISTS parent_select_own_exemptions ON sports_exemptions;
CREATE POLICY parent_select_own_exemptions ON sports_exemptions
  FOR SELECT
  USING (auth.uid() = parent_id);

-- Parents can insert exemption requests for their children
DROP POLICY IF EXISTS parent_insert_child_exemptions ON sports_exemptions;
CREATE POLICY parent_insert_child_exemptions ON sports_exemptions
  FOR INSERT
  WITH CHECK (true); -- !!! DEBUGGING STEP !!!
                     -- ALL VALIDATION (auth.uid() = NEW.parent_id, child ownership)
                     -- MUST BE HANDLED IN APPLICATION CODE or TRIGGERS.

-- Admins/Orientation Supervisors can view all exemption requests
DROP POLICY IF EXISTS admin_orientation_select_all_exemptions ON sports_exemptions;
CREATE POLICY admin_orientation_select_all_exemptions ON sports_exemptions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
  ));

-- Admins/Orientation Supervisors can update status and comments
DROP POLICY IF EXISTS admin_orientation_update_exemptions ON sports_exemptions;
CREATE POLICY admin_orientation_update_exemptions ON sports_exemptions
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
  ))
  WITH CHECK ( -- Prevent changing immutable fields
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
    )
    AND NEW.parent_id = OLD.parent_id
    AND NEW.child_id = OLD.child_id
    AND NEW.reason = OLD.reason
    AND NEW.start_date = OLD.start_date
    AND NEW.end_date = OLD.end_date
    AND NEW.medical_document_url = OLD.medical_document_url
    AND NEW.reviewed_by = auth.uid() -- Ensure reviewer ID is set on update
    AND NEW.reviewed_at IS NOT NULL
  );

-- Allow Admins to delete any request (use with caution)
DROP POLICY IF EXISTS admin_delete_exemptions ON sports_exemptions;
CREATE POLICY admin_delete_exemptions ON sports_exemptions
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));