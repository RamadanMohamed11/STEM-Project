-- Add group_id column to projects table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'group_id') THEN
        ALTER TABLE projects ADD COLUMN group_id UUID REFERENCES groups(id);
    END IF;
END $$;

-- Add group_id column to smart_goals table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'smart_goals' AND column_name = 'group_id') THEN
        ALTER TABLE smart_goals ADD COLUMN group_id UUID REFERENCES groups(id);
    END IF;
END $$;

-- Add indexes for better performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'projects_group_id_idx') THEN
        CREATE INDEX projects_group_id_idx ON projects(group_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'smart_goals_group_id_idx') THEN
        CREATE INDEX smart_goals_group_id_idx ON smart_goals(group_id);
    END IF;
END $$;

-- Update RLS policies for projects to allow access based on group membership
DROP POLICY IF EXISTS "Allow users to view projects in their groups" ON projects;
CREATE POLICY "Allow users to view projects in their groups" 
ON projects 
FOR SELECT 
USING (
    auth.uid() = user_id OR 
    group_id IN (
        SELECT group_id FROM group_members WHERE student_id = auth.uid()
    ) OR
    group_id IN (
        SELECT id FROM groups WHERE teacher_id = auth.uid()
    )
);

-- Allow students to create projects in groups they belong to
DROP POLICY IF EXISTS "Allow students to create projects in their groups" ON projects;
CREATE POLICY "Allow students to create projects in their groups" 
ON projects 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    group_id IN (
        SELECT group_id FROM group_members WHERE student_id = auth.uid()
    )
);

-- Update RLS policies for smart_goals to allow access based on group membership
DROP POLICY IF EXISTS "Allow users to view goals in their groups" ON smart_goals;
CREATE POLICY "Allow users to view goals in their groups" 
ON smart_goals 
FOR SELECT 
USING (
    auth.uid() = user_id OR 
    group_id IN (
        SELECT group_id FROM group_members WHERE student_id = auth.uid()
    ) OR
    group_id IN (
        SELECT id FROM groups WHERE teacher_id = auth.uid()
    )
);

-- Allow students to create goals in groups they belong to
DROP POLICY IF EXISTS "Allow students to create goals in their groups" ON smart_goals;
CREATE POLICY "Allow students to create goals in their groups" 
ON smart_goals 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    group_id IN (
        SELECT group_id FROM group_members WHERE student_id = auth.uid()
    )
);
