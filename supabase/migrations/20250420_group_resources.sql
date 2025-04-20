-- Create resources table for teachers to share with groups
CREATE TABLE IF NOT EXISTS group_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL, -- 'file', 'link', 'template', 'video', 'article', 'other'
  url TEXT, -- For external links
  file_path TEXT, -- For uploaded files
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_group_resources_group_id ON group_resources(group_id);

-- Enable Row Level Security
ALTER TABLE group_resources ENABLE ROW LEVEL SECURITY;

-- Teachers can manage resources for their groups
DROP POLICY IF EXISTS "Teachers can manage their group resources" ON group_resources;
CREATE POLICY "Teachers can manage their group resources"
ON group_resources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_resources.group_id
    AND groups.teacher_id = auth.uid()
  )
);

-- Students can view resources for groups they belong to
DROP POLICY IF EXISTS "Students can view group resources" ON group_resources;
CREATE POLICY "Students can view group resources"
ON group_resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_resources.group_id
    AND group_members.student_id = auth.uid()
  )
);

-- Create storage bucket for group resources
-- This section creates the bucket in storage schema
DO $$
BEGIN
  -- Check if the bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'group_resources'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('group_resources', 'group_resources', false);
    
    -- Set up RLS for the bucket
    -- Allow authenticated users to upload files
    EXECUTE format('CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''%s'' AND auth.uid() = owner)', 'group_resources');
    
    -- Allow users to access their own files
    EXECUTE format('CREATE POLICY "Users can access their own files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''%s'' AND auth.uid() = owner)', 'group_resources');
    
    -- Allow teachers to access files in their groups
    EXECUTE format('
      CREATE POLICY "Teachers can access group files" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = ''%s'' AND
        EXISTS (
          SELECT 1 FROM groups
          WHERE groups.teacher_id = auth.uid()
          AND EXISTS (
            SELECT 1 FROM group_resources
            WHERE group_resources.group_id = groups.id
            AND group_resources.file_path = storage.objects.name
          )
        )
      )
    ', 'group_resources');
    
    -- Allow students to access files in their groups
    EXECUTE format('
      CREATE POLICY "Students can access group files" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = ''%s'' AND
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.student_id = auth.uid()
          AND EXISTS (
            SELECT 1 FROM group_resources
            WHERE group_resources.group_id = group_members.group_id
            AND group_resources.file_path = storage.objects.name
          )
        )
      )
    ', 'group_resources');
    
    -- Allow teachers to delete files in their groups
    EXECUTE format('
      CREATE POLICY "Teachers can delete group files" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = ''%s'' AND
        EXISTS (
          SELECT 1 FROM groups
          WHERE groups.teacher_id = auth.uid()
          AND EXISTS (
            SELECT 1 FROM group_resources
            WHERE group_resources.group_id = groups.id
            AND group_resources.file_path = storage.objects.name
          )
        )
      )
    ', 'group_resources');
  END IF;
END $$;
