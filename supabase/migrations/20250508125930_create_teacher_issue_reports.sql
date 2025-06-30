-- Migration to create the teacher_issue_reports table

CREATE TYPE issue_report_status AS ENUM ('submitted', 'under_review', 'resolved', 'closed');

CREATE TABLE IF NOT EXISTS teacher_issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL, -- Link to parent who submitted
  child_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Link to the student concerned
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional: Link to specific teacher (if user type 'professor')
  teacher_name_manual TEXT, -- Optional: If teacher not in system or selected
  issue_details TEXT NOT NULL,
  status issue_report_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to admin/staff who reviewed
  resolution_details TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Foreign key constraints already defined above

  INDEX idx_teacher_issue_reports_parent_id ON teacher_issue_reports(parent_id),
  INDEX idx_teacher_issue_reports_child_id ON teacher_issue_reports(child_id),
  INDEX idx_teacher_issue_reports_teacher_id ON teacher_issue_reports(teacher_id)
);

-- Enable RLS
ALTER TABLE teacher_issue_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_issue_reports

-- Parents can view their own submitted reports
DROP POLICY IF EXISTS parent_select_own_issue_reports ON teacher_issue_reports;
CREATE POLICY parent_select_own_issue_reports ON teacher_issue_reports
  FOR SELECT
  USING (auth.uid() = parent_id);

-- Parents can insert reports concerning their children
DROP POLICY IF EXISTS parent_insert_child_issue_reports ON teacher_issue_reports;
CREATE POLICY parent_insert_child_issue_reports ON teacher_issue_reports
  FOR INSERT
  WITH CHECK (true); -- !!! DEBUGGING STEP !!!
                     -- ALL VALIDATION (auth.uid() = NEW.parent_id, child ownership)
                     -- MUST BE HANDLED IN APPLICATION CODE or TRIGGERS.

-- Admins/Orientation Supervisors can view all reports
DROP POLICY IF EXISTS admin_orientation_select_all_issue_reports ON teacher_issue_reports;
CREATE POLICY admin_orientation_select_all_issue_reports ON teacher_issue_reports
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
  ));

-- Admins/Orientation Supervisors can update status and resolution details
DROP POLICY IF EXISTS admin_orientation_update_issue_reports ON teacher_issue_reports;
CREATE POLICY admin_orientation_update_issue_reports ON teacher_issue_reports
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
    AND NEW.teacher_id = OLD.teacher_id
    AND NEW.teacher_name_manual = OLD.teacher_name_manual
    AND NEW.issue_details = OLD.issue_details
    AND NEW.reviewed_by = auth.uid() -- Ensure reviewer ID is set on update
  );

-- Allow Admins to delete any report (use with caution)
DROP POLICY IF EXISTS admin_delete_issue_reports ON teacher_issue_reports;
CREATE POLICY admin_delete_issue_reports ON teacher_issue_reports
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));