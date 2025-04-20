-- Fix RLS policies for groups table to allow students to view groups
DROP POLICY IF EXISTS "students_select_groups" ON groups;
DROP POLICY IF EXISTS "Allow students to view groups" ON groups;

-- Create a policy that allows all users to view groups (for joining purposes)
CREATE POLICY "allow_all_to_view_groups" 
ON groups 
FOR SELECT 
USING (true);

-- Fix RLS policies for group_members table
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;

-- Allow students to view group members
CREATE POLICY "view_group_members" 
ON group_members 
FOR SELECT 
USING (true);

-- Allow students to join groups
CREATE POLICY "students_join_groups" 
ON group_members 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);
