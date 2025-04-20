-- Enable Row Level Security on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Check and drop select policy
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Anyone can view profiles'
    ) THEN
        DROP POLICY "Anyone can view profiles" ON profiles;
    END IF;
    
    -- Check and drop insert policy
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        DROP POLICY "Users can insert their own profile" ON profiles;
    END IF;
    
    -- Check and drop update policy
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        DROP POLICY "Users can update their own profile" ON profiles;
    END IF;
    
    -- Check and drop delete policy
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can delete their own profile'
    ) THEN
        DROP POLICY "Users can delete their own profile" ON profiles;
    END IF;
END
$$;

-- Create new policies
-- Allow users to read any profile
CREATE POLICY "Anyone can view profiles"
ON profiles
FOR SELECT
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (id = auth.uid());

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
ON profiles
FOR DELETE
USING (id = auth.uid());
