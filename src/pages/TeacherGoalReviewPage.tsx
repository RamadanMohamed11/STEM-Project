import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { TeacherGoalReview } from '../components/goals/TeacherGoalReview';
import type { SmartGoal, Project } from '../types';

export const TeacherGoalReviewPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<SmartGoal[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    const fetchTeacherGoals = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, get all groups where the current user is the teacher
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('id')
          .eq('teacher_id', user.id);

        if (groupsError) throw groupsError;
        
        if (!groupsData || groupsData.length === 0) {
          setGoals([]);
          setLoading(false);
          return;
        }

        // Get all group IDs
        const groupIds = groupsData.map(group => group.id);

        // Get all SMART goals from these groups
        const { data: goalsData, error: goalsError } = await supabase
          .from('smart_goals')
          .select('*')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false });

        if (goalsError) throw goalsError;
        
        setGoals(goalsData || []);

        // Get all projects associated with these goals
        const projectIds = [...new Set((goalsData || []).map(goal => goal.project_id))];
        
        if (projectIds.length > 0) {
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds);

          if (projectsError) throw projectsError;
          
          // Convert projects array to a map for easy lookup
          const projectsMap: Record<string, Project> = {};
          (projectsData || []).forEach(project => {
            projectsMap[project.id] = project;
          });
          
          setProjects(projectsMap);
        }
      } catch (err: any) {
        console.error('Error fetching teacher goals:', err);
        setError(err.message || 'Failed to load goals');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherGoals();
  }, [user, navigate]);

  const handleGoalUpdated = () => {
    // Refresh the goals list
    setLoading(true);
    const fetchTeacherGoals = async () => {
      try {
        // First, get all groups where the current user is the teacher
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('id')
          .eq('teacher_id', user?.id);

        if (groupsError) throw groupsError;
        
        if (!groupsData || groupsData.length === 0) {
          setGoals([]);
          setLoading(false);
          return;
        }

        // Get all group IDs
        const groupIds = groupsData.map(group => group.id);

        // Get all SMART goals from these groups
        const { data: goalsData, error: goalsError } = await supabase
          .from('smart_goals')
          .select('*')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false });

        if (goalsError) throw goalsError;
        
        setGoals(goalsData || []);
      } catch (err) {
        console.error('Error refreshing goals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherGoals();
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.approval_status === filter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft size={16} />}
        >
          Back
        </Button>
        <h1 className="text-3xl font-bold text-slate-800">SMART Goal Review</h1>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <p className="text-slate-600">
          Review and provide feedback on student SMART goals.
        </p>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">Filter:</span>
          <div className="flex rounded-md overflow-hidden border border-slate-300">
            <button
              className={`px-3 py-1 text-sm ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 text-sm ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={`px-3 py-1 text-sm ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
              onClick={() => setFilter('approved')}
            >
              Approved
            </button>
            <button
              className={`px-3 py-1 text-sm ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
              onClick={() => setFilter('rejected')}
            >
              Needs Revision
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {!loading && !error && filteredGoals.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Filter size={24} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No goals to review</h2>
          <p className="text-slate-600 mb-6">
            {filter === 'all' 
              ? "There are no SMART goals from your groups to review yet." 
              : `There are no ${filter} SMART goals from your groups.`}
          </p>
          {filter !== 'all' && (
            <Button variant="outline" onClick={() => setFilter('all')}>
              Show All Goals
            </Button>
          )}
        </div>
      )}

      {!loading && !error && filteredGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGoals.map(goal => (
            <TeacherGoalReview
              key={goal.id}
              goal={goal}
              projectTitle={projects[goal.project_id]?.title || 'Unknown Project'}
              onGoalUpdated={handleGoalUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
};
