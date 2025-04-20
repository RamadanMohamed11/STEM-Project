-- Add teacher feedback and approval fields to smart_goals table
ALTER TABLE smart_goals 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
ADD COLUMN IF NOT EXISTS teacher_feedback TEXT,
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id);

-- Create an index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_smart_goals_approval_status ON smart_goals(approval_status);

-- Update RLS policies for smart_goals table
ALTER TABLE smart_goals ENABLE ROW LEVEL SECURITY;

-- Teachers can view all goals in their groups
CREATE POLICY "Teachers can view all goals in their groups"
ON smart_goals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = smart_goals.group_id
    AND groups.teacher_id = auth.uid()
  )
);

-- Teachers can update approval status and feedback for goals in their groups
CREATE POLICY "Teachers can update approval status and feedback"
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

-- Students can view their own goals and goals in their groups
CREATE POLICY "Students can view their own goals and group goals"
ON smart_goals
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM group_members
    JOIN groups ON groups.id = group_members.group_id
    WHERE group_members.student_id = auth.uid()
    AND groups.id = smart_goals.group_id
  )
);

-- Students can create and update their own goals
CREATE POLICY "Students can create and update their own goals"
ON smart_goals
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update their own goals"
ON smart_goals
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
