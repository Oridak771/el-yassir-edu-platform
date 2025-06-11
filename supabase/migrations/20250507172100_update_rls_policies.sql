-- Migration to add and update Row Level Security (RLS) policies

-- Removing the get_user_role function definition. Policies use subqueries.

-- #############################################
-- RLS Policies for 'users' table are now defined in the initial schema migration (20250505231115)
-- #############################################

-- #############################################
-- COMMENTING OUT OTHER POLICIES FOR DEBUGGING (Keep commented for now)
-- #############################################

/* -- RLS Policies for 'documents' table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_admin_all_access ON documents;
CREATE POLICY documents_admin_all_access ON documents FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS documents_owner_access ON documents;
CREATE POLICY documents_owner_access ON documents FOR SELECT USING (owner_id = auth.uid());
DROP POLICY IF EXISTS documents_owner_modify ON documents;
CREATE POLICY documents_owner_modify ON documents FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS documents_owner_delete ON documents;
CREATE POLICY documents_owner_delete ON documents FOR DELETE USING (owner_id = auth.uid());
DROP POLICY IF EXISTS documents_insert_authenticated ON documents;
CREATE POLICY documents_insert_authenticated ON documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS documents_shared_access ON documents;
CREATE POLICY documents_shared_access ON documents FOR SELECT USING (accessible_to ? auth.uid()::text OR (accessible_to ? 'all' AND auth.role() = 'authenticated'));
*/

/* -- RLS Policies for 'classes' table (Updates)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY; -- Ensure RLS is enabled if not already
-- SELECT policy already exists (classes_select_policy: USING (true))
DROP POLICY IF EXISTS classes_admin_insert_update_delete_policy ON classes;
CREATE POLICY classes_admin_insert_update_delete_policy ON classes FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
*/

/* -- RLS Policies for 'absences' table (Updates)
-- SELECT policy already exists (absences_select_policy)
DROP POLICY IF EXISTS absences_admin_insert_update_delete ON absences;
CREATE POLICY absences_admin_insert_update_delete ON absences FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS absences_professor_insert ON absences;
CREATE POLICY absences_professor_insert ON absences FOR INSERT USING ( EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'professor') AND auth.uid() IN (SELECT teacher_id FROM teacher_assignments ta WHERE ta.class_id = NEW.class_id) AND NEW.created_by = auth.uid() );
DROP POLICY IF EXISTS absences_professor_update_own ON absences;
CREATE POLICY absences_professor_update_own ON absences FOR UPDATE USING ( EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'professor') AND created_by = auth.uid() AND auth.uid() IN (SELECT teacher_id FROM teacher_assignments ta WHERE ta.class_id = absences.class_id) );
*/

/* -- RLS Policies for 'notifications' table (Updates)
-- SELECT policy already exists (notifications_select_policy: USING (auth.uid() = user_id))
DROP POLICY IF EXISTS notifications_update_read_status ON notifications;
CREATE POLICY notifications_update_read_status ON notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND NEW.user_id = OLD.user_id AND NEW.id = OLD.id);
DROP POLICY IF EXISTS notifications_admin_delete ON notifications;
CREATE POLICY notifications_admin_delete ON notifications FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
*/

/* -- RLS Policies for 'grades' table (Updates)
-- SELECT policy already exists (grades_select_policy)
DROP POLICY IF EXISTS grades_admin_all_access ON grades;
CREATE POLICY grades_admin_all_access ON grades FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS grades_professor_insert_update_for_assigned_class ON grades;
CREATE POLICY grades_professor_insert_update_for_assigned_class ON grades FOR ALL USING ( EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'professor') AND auth.uid() = teacher_id AND auth.uid() IN (SELECT ta.teacher_id FROM teacher_assignments ta WHERE ta.class_id = grades.class_id AND ta.subject = grades.subject) );
*/

/* -- RLS Policies for 'orientation_forms' table
ALTER TABLE orientation_forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orientation_forms_admin_orientation_all_access ON orientation_forms;
CREATE POLICY orientation_forms_admin_orientation_all_access ON orientation_forms FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation'))) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')));
DROP POLICY IF EXISTS orientation_forms_select_active ON orientation_forms;
CREATE POLICY orientation_forms_select_active ON orientation_forms FOR SELECT USING (active = TRUE AND auth.role() = 'authenticated');
*/

/* -- RLS Policies for 'orientation_responses' table
ALTER TABLE orientation_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orientation_responses_admin_orientation_all_access ON orientation_responses;
CREATE POLICY orientation_responses_admin_orientation_all_access ON orientation_responses FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation'))) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')));
DROP POLICY IF EXISTS orientation_responses_student_own_response ON orientation_responses;
CREATE POLICY orientation_responses_student_own_response ON orientation_responses FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS orientation_responses_parent_child_response ON orientation_responses;
CREATE POLICY orientation_responses_parent_child_response ON orientation_responses FOR SELECT USING ( EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'parent') AND EXISTS ( SELECT 1 FROM users child_user WHERE child_user.id = orientation_responses.student_id AND child_user.metadata->>'parent_id' = auth.uid()::text ) );
DROP POLICY IF EXISTS orientation_responses_student_insert ON orientation_responses;
CREATE POLICY orientation_responses_student_insert ON orientation_responses FOR INSERT WITH CHECK ( student_id = auth.uid() AND EXISTS (SELECT 1 FROM orientation_forms WHERE id = NEW.form_id AND active = TRUE) );
*/

/* -- RLS Policies for 'events' table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_admin_all_access ON events;
CREATE POLICY events_admin_all_access ON events FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS events_creator_access ON events;
CREATE POLICY events_creator_access ON events FOR ALL USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
DROP POLICY IF EXISTS events_public_select ON events;
CREATE POLICY events_public_select ON events FOR SELECT USING ( (visible_to ? 'all' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role::text = ANY(SELECT jsonb_array_elements_text(visible_to))) OR visible_to ? auth.uid()::text) AND auth.role() = 'authenticated' );
*/

/* -- RLS Policies for 'meetings' table
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meetings_admin_all_access ON meetings;
CREATE POLICY meetings_admin_all_access ON meetings FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS meetings_organizer_access ON meetings;
CREATE POLICY meetings_organizer_access ON meetings FOR ALL USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());
DROP POLICY IF EXISTS meetings_attendee_select ON meetings;
CREATE POLICY meetings_attendee_select ON meetings FOR SELECT USING (attendees ? auth.uid()::text OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role::text = ANY(SELECT jsonb_array_elements_text(attendees))));
*/

/* -- RLS Policies for 'payments' table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_admin_all_access ON payments;
CREATE POLICY payments_admin_all_access ON payments FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS payments_parent_child_access ON payments;
CREATE POLICY payments_parent_child_access ON payments FOR SELECT USING ( EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'parent') AND EXISTS ( SELECT 1 FROM users child_user WHERE child_user.id = payments.student_id AND child_user.metadata->>'parent_id' = auth.uid()::text ) );
DROP POLICY IF EXISTS payments_student_own_access ON payments;
CREATE POLICY payments_student_own_access ON payments FOR SELECT USING (student_id = auth.uid());
*/

/* -- RLS Policies for 'class_enrollments' table
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS class_enrollments_admin_all_access ON class_enrollments;
CREATE POLICY class_enrollments_admin_all_access ON class_enrollments FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS class_enrollments_student_own_select ON class_enrollments;
CREATE POLICY class_enrollments_student_own_select ON class_enrollments FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS class_enrollments_parent_child_select ON class_enrollments;
CREATE POLICY class_enrollments_parent_child_select ON class_enrollments FOR SELECT USING ( EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'parent') AND EXISTS ( SELECT 1 FROM users child_user WHERE child_user.id = class_enrollments.student_id AND child_user.metadata->>'parent_id' = auth.uid()::text ) );
DROP POLICY IF EXISTS class_enrollments_teacher_class_select ON class_enrollments;
CREATE POLICY class_enrollments_teacher_class_select ON class_enrollments FOR SELECT USING ( EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'professor') AND EXISTS ( SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = class_enrollments.class_id AND ta.teacher_id = auth.uid() ) );
*/

/* -- RLS Policies for 'teacher_assignments' table
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS teacher_assignments_admin_all_access ON teacher_assignments;
CREATE POLICY teacher_assignments_admin_all_access ON teacher_assignments FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS teacher_assignments_public_select ON teacher_assignments;
CREATE POLICY teacher_assignments_public_select ON teacher_assignments FOR SELECT USING (auth.role() = 'authenticated');
*/