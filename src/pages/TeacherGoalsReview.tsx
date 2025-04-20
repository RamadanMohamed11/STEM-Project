import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { GroupedGoalsList } from '../components/goals/GroupedGoalsList';
import type { SmartGoal, Project, Profile } from '../types';

export const TeacherGoalsReview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<SmartGoal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const checkTeacherRole = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || data?.role !== 'teacher') {
        navigate('/dashboard');
        return;
      }
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if user is a teacher
        await checkTeacherRole();
        
        // Fetch students
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student');

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);
        
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*');

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch all student goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('smart_goals')
          .select('*')
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
    const matchesStudent = selectedStudent === 'all' || goal.user_id === selectedStudent;
    const matchesProject = selectedProject === 'all' || goal.project_id === selectedProject;
    
    return matchesSearch && matchesStudent && matchesProject;
  });

  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  const handleGoalUpdated = async () => {
    // Refresh goals list
    try {
      const { data, error } = await supabase
        .from('smart_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error refreshing goals:', error);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="p-0 h-8 w-8"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-3xl font-bold text-slate-800">Student SMART Goals</h1>
          </div>
          <p className="text-slate-600 mt-1">Review and manage student goals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
        </div>
        
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
        >
          <option value="all">All Students</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.first_name} {student.last_name}
            </option>
          ))}
        </select>
        
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
      </div>

      {/* Goals List */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredGoals.length > 0 ? (
        <div className="space-y-8">
          {selectedStudent === 'all' ? (
            // Group by student when all students are selected
            students.map(student => {
              const studentGoals = filteredGoals.filter(goal => goal.user_id === student.id);
              if (studentGoals.length === 0) return null;
              
              return (
                <div key={student.id} className="mb-8">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                    <Users size={20} className="text-slate-600" />
                    <h2 className="text-xl font-semibold text-slate-800">
                      {student.first_name} {student.last_name}
                    </h2>
                    <span className="text-sm text-slate-500">({studentGoals.length} goals)</span>
                  </div>
                  <GroupedGoalsList 
                    goals={studentGoals}
                    projectTitle={selectedProject === 'all' ? '' : getProjectTitle(selectedProject)}
                    onGoalUpdated={handleGoalUpdated}
                  />
                </div>
              );
            })
          ) : (
            // Show goals for selected student
            <GroupedGoalsList 
              goals={filteredGoals}
              projectTitle={selectedProject === 'all' ? '' : getProjectTitle(selectedProject)}
              onGoalUpdated={handleGoalUpdated}
            />
          )}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Users size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Goals Found</h3>
            <p className="text-slate-600 mb-6">
              {searchTerm
                ? "No goals match your search criteria"
                : "No student goals available for review"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
