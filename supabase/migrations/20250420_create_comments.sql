-- Create comments table for project and goal comments
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    author_name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'student' or 'teacher'
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES smart_goals(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own comments
CREATE POLICY "Users can insert their own comments"
    ON comments
    FOR INSERT
    WITH CHECK (author_id = auth.uid());

-- Allow users to select all comments
CREATE POLICY "Users can view comments"
    ON comments
    FOR SELECT
    USING (true);
