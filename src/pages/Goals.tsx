import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CategorizedGoalsList } from '../components/goals/CategorizedGoalsList';
import type { SmartGoal, Project } from '../types';

export const Goals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<SmartGoal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects first
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Then fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('smart_goals')
          .select('*, projects(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (goalsError) throw goalsError;
        setGoals(goalsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'all' || goal.project_id === selectedProject;
    
    return matchesSearch && matchesProject;
  });

  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">SMART Goals</h1>
          <p className="text-slate-600 mt-1">Track and manage your SMART goals across all projects</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <Button
            onClick={() => navigate('/goals/new')}
            className="group transition-all duration-300 transform hover:scale-105"
          >
            <PlusCircle size={18} className="mr-2 transition-transform duration-300 group-hover:rotate-90" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
        </div>
      </div>

      {/* Goals */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredGoals.length > 0 ? (
        <CategorizedGoalsList 
          goals={filteredGoals} 
          getProjectTitle={getProjectTitle} 
        />
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Target size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Goals Found</h3>
            <p className="text-slate-600 mb-6">
              {searchTerm
                ? "No goals match your search criteria"
                : "Get started by creating your first SMART goal"}
            </p>
            <Button
              onClick={() => navigate('/goals/new')}
              className="inline-flex items-center transition-all duration-300 transform hover:scale-105"
            >
              <PlusCircle size={18} className="mr-2" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
