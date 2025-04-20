-- Drop existing tables if they exist
DROP TABLE IF EXISTS goal_comments CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Create groups table
CREATE TABLE groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code VARCHAR(8) UNIQUE NOT NULL,
    teacher_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create group_members table for student-group relationships
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (group_id, student_id)
);

-- Create goal_comments table
CREATE TABLE goal_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID REFERENCES smart_goals(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add group_id to smart_goals table
ALTER TABLE smart_goals
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Create RLS policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_comments ENABLE ROW LEVEL SECURITY;

-- Teachers can create, manage, and view their groups
CREATE POLICY "Teachers can manage their groups"
ON groups
FOR ALL
USING (teacher_id = auth.uid());

-- Students can view groups they are members of
CREATE POLICY "Students can view groups"
ON groups
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = groups.id 
    AND student_id = auth.uid()
) OR teacher_id = auth.uid());

-- Group members policies
CREATE POLICY "Teachers can manage group members"
ON group_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM groups
        WHERE id = group_members.group_id
        AND teacher_id = auth.uid()
    )
);

CREATE POLICY "Students can view their group memberships"
ON group_members
FOR SELECT
USING (student_id = auth.uid());

-- Goal comments policies
CREATE POLICY "Users can create comments"
ON goal_comments
FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their comments"
ON goal_comments
FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Users can delete their comments"
ON goal_comments
FOR DELETE
USING (author_id = auth.uid());

CREATE POLICY "Users can view comments"
ON goal_comments
FOR SELECT
USING (TRUE);

-- Function to generate random group code
DROP FUNCTION IF EXISTS generate_group_code();
CREATE OR REPLACE FUNCTION generate_group_code()
RETURNS VARCHAR(8)
LANGUAGE plpgsql
AS $$
DECLARE
    code VARCHAR(8);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character code using uppercase letters and numbers
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS (
            SELECT 1 FROM groups WHERE groups.code = code
        ) INTO code_exists;
        
        -- Exit loop if unique code is found
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN code;
END;
$$;