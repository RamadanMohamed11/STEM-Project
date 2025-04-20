import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  role: string; // 'student' | 'teacher'
  project_id: string | null;
  goal_id: string | null;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  categories: string[];
  created_at: string;
  updated_at: string;
}

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setProject(data);
      } catch (err) {
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      // Join with profiles to get the author's role
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles:author_id(role)')
        .eq('project_id', id)
        .order('created_at', { ascending: true });
      if (!error && data) {
        // Map the joined data to include the role
        setComments(
          data.map((comment: any) => ({
            ...comment,
            role: comment.profiles?.role || 'student', // fallback to student if not found
          }))
        );
      }
    };
    fetchComments();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    // Validate project_id (id) is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      console.error('Invalid project_id (id) for comment:', id);
      alert('Cannot add comment: Invalid project ID.');
      return;
    }
    const role = user.user_metadata?.role || 'student';
    const payload = {
      content: newComment,
      author_id: user.id,
      author_name: user.user_metadata?.name || user.email,
      project_id: id ?? null,
      goal_id: null,
    };
    console.log('Attempting to insert comment with payload:', payload);
    const { data, error } = await supabase
      .from('comments')
      .insert([payload])
      .select('*')
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error, 'Payload:', payload);
      alert('Failed to add comment: ' + (error.message || error.details || 'Unknown error'));
      return;
    }
    
    // If successful, add the new comment to the state
    if (data) {
      console.log('Comment added successfully:', data);
      
      // Add the new comment to the state with the role for UI display
      setComments((prev) => [
        ...prev,
        {
          ...data,
          role, // Add role for UI display purposes
          created_at: data.created_at || new Date().toISOString(),
        },
      ]);
      
      setNewComment('');
    }
  };

  // const isTeacher = user?.user_metadata?.role === 'teacher';

  if (loading) return <div className="p-8">Loading...</div>;
  if (error || !project) return <div className="p-8 text-red-600">{error || 'Project not found'}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card>
        <CardContent>
          <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
          <p className="mb-4 text-slate-700">{project.description}</p>
          <div className="mb-6">
            <span className="text-xs text-slate-500">Categories: {project.categories?.join(', ')}</span>
          </div>
          <hr className="my-4" />
          <h2 className="text-xl font-semibold mb-3">Comments</h2>
          <div className="space-y-3 mb-4">
            {comments.length === 0 && <div className="text-slate-500">No comments yet.</div>}
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded-md border flex flex-col ${
                  comment.role === 'teacher'
                    ? 'bg-blue-50 border-blue-300 ml-auto max-w-[85%] text-right shadow-sm'
                    : 'bg-green-50 border-green-300 mr-auto max-w-[85%] text-left shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {comment.role === 'teacher' ? (
                    <span className="inline-block px-2 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full font-semibold">Teacher</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 text-xs bg-green-200 text-green-800 rounded-full font-semibold">Student</span>
                  )}
                  <span className="text-xs text-slate-500">{comment.author_name}</span>
                </div>
                <div className="text-sm text-slate-700">{comment.content}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(comment.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
          {/* Allow both students and teachers to comment */}
          {user && (
            <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-2">
              <textarea
                className="border border-slate-300 rounded-md p-2"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
              />
              <Button type="submit" variant="primary">Add Comment</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetail;
