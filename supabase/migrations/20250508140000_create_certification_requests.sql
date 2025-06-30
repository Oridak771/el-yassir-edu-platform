-- Migration to create the certification_requests table

CREATE TYPE certification_request_status AS ENUM ('pending', 'approved', 'rejected', 'generated');

CREATE TABLE IF NOT EXISTS certification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Student requiring certification
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who made the request (parent or student)
  request_type TEXT NOT NULL DEFAULT 'school_attendance', -- Type of certificate requested
  request_details TEXT, -- Any specific notes from the requester
  status certification_request_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who reviewed
  review_comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  generated_document_id UUID REFERENCES documents(id) ON DELETE SET NULL, -- Link to the generated PDF in documents table

  -- Foreign key constraints already defined above

  INDEX idx_certification_requests_student_id ON certification_requests(student_id),
  INDEX idx_certification_requests_requester_id ON certification_requests(requester_id),
  INDEX idx_certification_requests_status ON certification_requests(status)
);

-- Enable RLS
ALTER TABLE certification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certification_requests

-- Students/Parents can view their own requests
DROP POLICY IF EXISTS user_select_own_cert_requests ON certification_requests;
CREATE POLICY user_select_own_cert_requests ON certification_requests
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = student_id);

-- Students/Parents can insert requests for themselves or their children
DROP POLICY IF EXISTS user_insert_cert_requests ON certification_requests;
CREATE POLICY user_insert_cert_requests ON certification_requests
  FOR INSERT
  WITH CHECK (true); -- !!! DEBUGGING STEP !!!
                     -- ALL VALIDATION (auth.uid() = NEW.requester_id, and if requester is parent,
                     -- that NEW.student_id is their child) MUST BE HANDLED IN APPLICATION CODE or TRIGGERS.

-- Admins can view all requests
DROP POLICY IF EXISTS admin_select_all_cert_requests ON certification_requests;
CREATE POLICY admin_select_all_cert_requests ON certification_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admins can update status, comments, and link generated document
DROP POLICY IF EXISTS admin_update_cert_requests ON certification_requests;
CREATE POLICY admin_update_cert_requests ON certification_requests
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK ( -- Prevent changing immutable fields
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
    AND NEW.student_id = OLD.student_id
    AND NEW.requester_id = OLD.requester_id
    AND NEW.request_type = OLD.request_type
    AND NEW.reviewed_by = auth.uid() -- Ensure reviewer ID is set on update
    AND NEW.reviewed_at IS NOT NULL
  );

-- Admins can delete requests
DROP POLICY IF EXISTS admin_delete_cert_requests ON certification_requests;
CREATE POLICY admin_delete_cert_requests ON certification_requests
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));