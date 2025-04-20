-- Add achieved and achieved_at columns to smart_goals table
ALTER TABLE smart_goals 
ADD COLUMN IF NOT EXISTS achieved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS achieved_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on achieved status
CREATE INDEX IF NOT EXISTS idx_smart_goals_achieved ON smart_goals(achieved);

-- Update the RLS policy to allow teachers to update the achieved status
DROP POLICY IF EXISTS "Teachers can update goals for their groups" ON smart_goals;
CREATE POLICY "Teachers can update goals for their groups"
ON smart_goals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = smart_goals.group_id
    AND groups.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = smart_goals.group_id
    AND groups.teacher_id = auth.uid()
  )
);

-- Add policy for teachers to delete goals
DROP POLICY IF EXISTS "Teachers can delete goals for their groups" ON smart_goals;
CREATE POLICY "Teachers can delete goals for their groups"
ON smart_goals
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = smart_goals.group_id
    AND groups.teacher_id = auth.uid()
  )
);
