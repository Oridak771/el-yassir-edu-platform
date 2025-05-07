-- Schema for Education Administration Platform

-- Enable Row Level Security
--ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';
--ALTER DATABASE postgres SET "app.jwt_exp" TO 3600;

-- Users table with role-based access
CREATE TYPE user_role AS ENUM ('admin', 'parent', 'professor', 'orientation');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  room_number TEXT,
  schedule JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class enrollments (maps students to classes)
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  UNIQUE(class_id, student_id)
);

-- Teacher assignments (maps teachers to classes)
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, teacher_id, subject)
);

-- Absences table
CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  justified BOOLEAN DEFAULT FALSE,
  justification_document_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  assignment_name TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  total_possible DECIMAL(5,2) NOT NULL,
  weight DECIMAL(5,2) DEFAULT 1.0,
  date DATE NOT NULL,
  teacher_id UUID REFERENCES users(id),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events calendar
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  event_type TEXT NOT NULL,
  creator_id UUID REFERENCES users(id),
  visible_to JSONB DEFAULT '["all"]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  accessible_to JSONB DEFAULT '["owner"]'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orientation forms
CREATE TABLE IF NOT EXISTS orientation_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  creator_id UUID REFERENCES users(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orientation responses
CREATE TABLE IF NOT EXISTS orientation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES orientation_forms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  decision TEXT,
  decision_date TIMESTAMP WITH TIME ZONE,
  decision_by UUID REFERENCES users(id)
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTERVAL NOT NULL,
  location TEXT,
  organizer_id UUID REFERENCES users(id),
  attendees JSONB NOT NULL,
  meeting_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_type TEXT NOT NULL,
  status TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION get_user_role(user_id_to_check UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public -- IMPORTANT: Set search_path to prevent hijacking and ensure 'users' table is found
AS $$
  SELECT role::TEXT FROM users WHERE id = user_id_to_check;
$$;

GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (
    -- Allow any authenticated user to select their own record
    auth.uid() = users.id
    -- OR if the current authenticated user's role is 'admin' or 'orientation'
    OR get_user_role(auth.uid()) IN ('admin', 'orientation')
    -- (Optional but good practice: Allow parents to see their linked children - assuming parent_id is in metadata)
    -- OR auth.uid() IN (SELECT id FROM users WHERE role = 'parent' AND users.metadata->>'parent_id' = auth.uid()::text)
  );

-- Classes table policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY classes_select_policy ON classes
  FOR SELECT USING (true); -- All authenticated users can view classes

-- Absences table policies
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY absences_select_policy ON absences
  FOR SELECT USING (
    -- Admins and orientation can see all absences
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'orientation'))
    -- Parents can only see their children's absences
    OR auth.uid() IN (
      SELECT p.id FROM users p
      JOIN users s ON s.metadata->>'parent_id' = p.id::text
      WHERE p.role = 'parent' AND s.id = absences.student_id
    )
    -- Professors can see absences for classes they teach
    OR auth.uid() IN (
      SELECT t.teacher_id FROM teacher_assignments t
      WHERE t.class_id = absences.class_id
    )
  );

-- Notifications table policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Grades table policies
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY grades_select_policy ON grades
  FOR SELECT USING (
    -- Admins and orientation can see all grades
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'orientation'))
    -- Parents can only see their children's grades
    OR auth.uid() IN (
      SELECT p.id FROM users p
      JOIN users s ON s.metadata->>'parent_id' = p.id::text
      WHERE p.role = 'parent' AND s.id = grades.student_id
    )
    -- Professors can see grades for classes they teach
    OR auth.uid() IN (
      SELECT t.teacher_id FROM teacher_assignments t
      WHERE t.class_id = grades.class_id
    )
    -- Students can see their own grades
    OR auth.uid() = grades.student_id
  );

-- Trigger functions
CREATE OR REPLACE FUNCTION notify_absence_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify administration
  INSERT INTO notifications (user_id, title, message, type, metadata)
  SELECT 
    id, 
    'New Absence Recorded', 
    'A student absence has been recorded', 
    'absence', 
    json_build_object('absence_id', NEW.id, 'student_id', NEW.student_id)
  FROM users WHERE role = 'admin';
  
  -- Notify parent
  INSERT INTO notifications (user_id, title, message, type, metadata)
  SELECT 
    p.id, 
    'Your Child Absence Alert', 
    'Your child has been marked absent', 
    'absence', 
    json_build_object('absence_id', NEW.id, 'student_id', NEW.student_id)
  FROM users s
  JOIN users p ON s.metadata->>'parent_id' = p.id::text
  WHERE s.id = NEW.student_id AND p.role = 'parent';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER absence_notification_trigger
AFTER INSERT ON absences
FOR EACH ROW
EXECUTE FUNCTION notify_absence_insert();

CREATE OR REPLACE FUNCTION notify_grade_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify parent
  INSERT INTO notifications (user_id, title, message, type, metadata)
  SELECT 
    p.id, 
    'New Grade Posted', 
    'A new grade has been posted for your child', 
    'grade', 
    json_build_object('grade_id', NEW.id, 'student_id', NEW.student_id, 'score', NEW.score, 'total', NEW.total_possible)
  FROM users s
  JOIN users p ON s.metadata->>'parent_id' = p.id::text
  WHERE s.id = NEW.student_id AND p.role = 'parent';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER grade_notification_trigger
AFTER INSERT ON grades
FOR EACH ROW
EXECUTE FUNCTION notify_grade_insert();
