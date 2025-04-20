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
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true });
      if (!error) setComments(data || []);
    };
    fetchComments();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          content: newComment,
          author_id: user.id,
          author_name: user.user_metadata?.name || user.email,
          project_id: id,
          goal_id: null,
        },
      ]);
    if (!error) {
      setComments((prev) => [
        ...prev,
        {
          id: data[0].id,
          content: newComment,
          author_id: user.id,
          author_name: user.user_metadata?.name || user.email,
          project_id: id,
          goal_id: null,
          created_at: new Date().toISOString(),
        },
      ]);
      setNewComment('');
    }
  };

  const isTeacher = user?.user_metadata?.role === 'teacher';

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
              <div key={comment.id} className="p-3 bg-slate-100 rounded-md">
                <div className="text-sm text-slate-700">{comment.content}</div>
                <div className="text-xs text-slate-500 mt-1">By {comment.author_name} on {new Date(comment.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
          {isTeacher && (
            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
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
