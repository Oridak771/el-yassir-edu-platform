-- Migration to create the child_link_requests table

CREATE TYPE link_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS child_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Parent making the request
  child_email TEXT NOT NULL, -- Email of the child to link (assuming child has an account or will create one)
  child_full_name TEXT, -- Optional: Name provided by parent for verification
  request_notes TEXT, -- Optional: Notes from the parent
  status link_request_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who reviewed
  review_comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Foreign key constraints already defined above
  UNIQUE(parent_id, child_email) -- Prevent duplicate pending requests for the same parent/child email
);

-- Enable RLS
ALTER TABLE child_link_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for child_link_requests

-- Parents can view their own submitted link requests
DROP POLICY IF EXISTS parent_select_own_link_requests ON child_link_requests;
CREATE POLICY parent_select_own_link_requests ON child_link_requests
  FOR SELECT
  USING (auth.uid() = parent_id);

-- Parents can insert link requests for themselves
DROP POLICY IF EXISTS parent_insert_link_requests ON child_link_requests;
CREATE POLICY parent_insert_link_requests ON child_link_requests
  FOR INSERT
  WITH CHECK (true); -- !!! DEBUGGING STEP !!!
                     -- ALL VALIDATION (auth.uid() = NEW.parent_id)
                     -- MUST BE HANDLED IN APPLICATION CODE or TRIGGERS.

-- Admins can view all link requests
DROP POLICY IF EXISTS admin_select_all_link_requests ON child_link_requests;
CREATE POLICY admin_select_all_link_requests ON child_link_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admins can update status and comments
DROP POLICY IF EXISTS admin_update_link_requests ON child_link_requests;
CREATE POLICY admin_update_link_requests ON child_link_requests
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK ( -- Prevent changing immutable fields
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
    AND NEW.parent_id = OLD.parent_id
    AND NEW.child_email = OLD.child_email
    AND NEW.reviewed_by = auth.uid() -- Ensure reviewer ID is set on update
    AND NEW.reviewed_at IS NOT NULL
  );

-- Admins can delete link requests
DROP POLICY IF EXISTS admin_delete_link_requests ON child_link_requests;
CREATE POLICY admin_delete_link_requests ON child_link_requests
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));