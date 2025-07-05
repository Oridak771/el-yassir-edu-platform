-- Migration to create the user_notification_preferences table

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL, -- e.g., 'orientation_updates', 'new_questionnaire_alert', 'grade_notifications'
  is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  channel TEXT DEFAULT 'in_app', -- e.g., 'in_app', 'email' (for future expansion)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, notification_type, channel) -- Ensure unique preference per user, type, and channel
);

-- Enable RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notification_preferences

-- Users can view and update their own preferences
DROP POLICY IF EXISTS user_manage_own_notification_prefs ON user_notification_preferences;
CREATE POLICY user_manage_own_notification_prefs ON user_notification_preferences
  FOR ALL -- SELECT, INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orientation Supervisors/Admins can view all preferences
DROP POLICY IF EXISTS orientation_admin_select_all_notification_prefs ON user_notification_preferences;
CREATE POLICY orientation_admin_select_all_notification_prefs ON user_notification_preferences
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
  ));

-- Orientation Supervisors/Admins can update 'is_subscribed' for users (e.g., bulk opt-out/in)
DROP POLICY IF EXISTS orientation_admin_update_notification_prefs ON user_notification_preferences;
CREATE POLICY orientation_admin_update_notification_prefs ON user_notification_preferences
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
  ))
  WITH CHECK ( -- Allow changing only 'is_subscribed' and 'updated_at' by supervisor
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'orientation')
    )
    AND NEW.user_id = OLD.user_id
    AND NEW.notification_type = OLD.notification_type
    AND NEW.channel = OLD.channel
  );

-- Admins can delete preferences (use with caution)
DROP POLICY IF EXISTS admin_delete_notification_prefs ON user_notification_preferences;
CREATE POLICY admin_delete_notification_prefs ON user_notification_preferences
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Seed some default notification types if they don't exist (conceptual, actual types managed by app logic)
-- This is more for documentation; actual types are defined by application needs.
COMMENT ON COLUMN user_notification_preferences.notification_type IS
'Examples: orientation_updates, new_questionnaire_alert, grade_notifications, absence_alerts, event_reminders, school_announcements';