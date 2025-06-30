-- Drop existing policies
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_insert_own_policy ON users;
DROP POLICY IF EXISTS users_select_policy ON users;

-- Allow users to insert their own row (registration)
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- Allow users to select their own row
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (
    auth.uid() = id
  );
