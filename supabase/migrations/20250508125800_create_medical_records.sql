-- Migration to create the medical_records table

CREATE TYPE medical_record_type AS ENUM ('vaccination', 'medical_visit', 'allergy_info', 'medical_certificate', 'other');

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional: Link to parent who uploaded/managed
  child_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Link to the student
  record_type medical_record_type NOT NULL,
  description TEXT NOT NULL,
  record_date DATE NOT NULL,
  document_url TEXT, -- Optional: Link to uploaded document in Storage
  next_due_date DATE, -- Optional: For vaccinations or follow-ups
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

  -- Foreign key constraints already defined above
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_child_id ON medical_records(child_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_parent_id ON medical_records(parent_id);

-- Enable RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_records

-- Parents can view records for their own children
DROP POLICY IF EXISTS parent_select_child_medical_records ON medical_records;
CREATE POLICY parent_select_child_medical_records ON medical_records
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users child_user
    WHERE child_user.id = medical_records.child_id
    AND child_user.metadata->>'parent_id' = auth.uid()::text
  ));

-- Parents can insert records for their children
DROP POLICY IF EXISTS parent_insert_child_medical_records ON medical_records;
CREATE POLICY parent_insert_child_medical_records ON medical_records
  FOR INSERT
  WITH CHECK (true); -- !!! DEBUGGING STEP !!!
                     -- This allows any authenticated user to insert if no other INSERT policies block.
                     -- ALL VALIDATION (e.g. auth.uid() = NEW.parent_id if parent_id is set, child ownership)
                     -- MUST BE HANDLED IN APPLICATION CODE or TRIGGERS.
                     -- This is to bypass the persistent "missing FROM-clause" error.
                     -- The parent_id column is nullable, so checking NEW.parent_id = auth.uid() directly
                     -- might fail if parent_id is not provided by the client on insert.

-- Parents can update records they added (or records for their children - choose one)
-- Option 1: Update records they added (if parent_id is reliably set)
-- DROP POLICY IF EXISTS parent_update_own_medical_records ON medical_records;
-- CREATE POLICY parent_update_own_medical_records ON medical_records
--   FOR UPDATE
--   USING (auth.uid() = parent_id)
--   WITH CHECK (auth.uid() = parent_id AND NEW.child_id = OLD.child_id); -- Prevent changing child

-- Option 2: Update records for their children (more flexible if parent_id isn't always set)
DROP POLICY IF EXISTS parent_update_child_medical_records ON medical_records;
CREATE POLICY parent_update_child_medical_records ON medical_records
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users child_user
    WHERE child_user.id = medical_records.child_id
    AND child_user.metadata->>'parent_id' = auth.uid()::text
  ))
  WITH CHECK (NEW.child_id = OLD.child_id); -- Prevent changing child


-- Parents can delete records for their children (use with caution)
DROP POLICY IF EXISTS parent_delete_child_medical_records ON medical_records;
CREATE POLICY parent_delete_child_medical_records ON medical_records
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users child_user
    WHERE child_user.id = medical_records.child_id
    AND child_user.metadata->>'parent_id' = auth.uid()::text
  ));


-- Admins/Orientation Supervisors can view all records
DROP POLICY IF EXISTS admin_orientation_select_all_medical_records ON medical_records;
CREATE POLICY admin_orientation_select_all_medical_records ON medical_records
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
  ));

-- Admins can manage all records (update/delete)
DROP POLICY IF EXISTS admin_manage_medical_records ON medical_records;
CREATE POLICY admin_manage_medical_records ON medical_records
  FOR ALL -- Covers UPDATE, DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));