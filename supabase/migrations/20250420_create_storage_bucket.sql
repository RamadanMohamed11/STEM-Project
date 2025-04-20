-- Create storage bucket for group resources
-- This is a separate migration file to ensure the bucket is created properly

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'group_resources', 'group_resources', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'group_resources'
);

-- Set up RLS policies for the bucket
-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can access group files" ON storage.objects;
DROP POLICY IF EXISTS "Students can access group files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete group files" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'group_resources' AND auth.uid() = owner);

-- Allow users to access their own files
CREATE POLICY "Users can access their own files" 
ON storage.objects 
FOR SELECT TO authenticated 
USING (bucket_id = 'group_resources' AND auth.uid() = owner);

-- Allow teachers to access files in their groups
CREATE POLICY "Teachers can access group files" 
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'group_resources' AND
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_resources
      WHERE group_resources.group_id = groups.id
      AND group_resources.file_path = storage.objects.name
    )
  )
);

-- Allow students to access files in their groups
CREATE POLICY "Students can access group files" 
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'group_resources' AND
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_resources
      WHERE group_resources.group_id = group_members.group_id
      AND group_resources.file_path = storage.objects.name
    )
  )
);

-- Allow teachers to delete files in their groups
CREATE POLICY "Teachers can delete group files" 
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'group_resources' AND
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_resources
      WHERE group_resources.group_id = groups.id
      AND group_resources.file_path = storage.objects.name
    )
  )
);
