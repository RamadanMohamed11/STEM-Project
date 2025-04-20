import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, FolderPlus, PlusCircle, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { CategorizedGoalsList } from '../components/goals/CategorizedGoalsList';
import type { Project, SmartGoal } from '../types';

interface GroupDetails {
  id: string;
  name: string;
  code: string;
  created_at: string;
  teacher_id: string;
}

interface GroupMember {
  student_id: string;
  joined_at: string;
  profile: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<SmartGoal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch group details
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);
        
        // Check if current user is the teacher of this group
        setIsTeacher(groupData.teacher_id === user.id);

        // Fetch group members with profiles
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select(`
            student_id,
            joined_at,
            profile:profiles(name, email, avatar)
          `)
          .eq('group_id', id);

        if (membersError) throw membersError;
        
        // Transform the data to match the GroupMember interface
        const formattedMembers = (membersData || []).map(member => {
          // Ensure profile is treated as a single object, not an array
          const profileData = Array.isArray(member.profile) ? member.profile[0] : member.profile;
          
          return {
            student_id: member.student_id,
            joined_at: member.joined_at,
            profile: {
              name: profileData?.name || 'Unknown',
              email: profileData?.email || '',
              avatar: profileData?.avatar
            }
          };
        });
        
        setMembers(formattedMembers);

        // Fetch projects associated with this group
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('group_id', id);

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch SMART goals associated with this group
        const { data: goalsData, error: goalsError } = await supabase
          .from('smart_goals')
          .select('*')
          .eq('group_id', id);

        if (goalsError) throw goalsError;
        setGoals(goalsData || []);

      } catch (err: any) {
        console.error('Error fetching group details:', err);
        setError(err.message || 'Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Group</h2>
          <p className="text-slate-700 mb-6">{error}</p>
          <Button onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-3xl font-bold text-slate-800">{group.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Group Code</p>
                <h3 className="text-2xl font-bold text-slate-800">{group.code}</h3>
                <p className="text-sm text-slate-500 mt-1">Share this code with students to join</p>
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              {!isTeacher && (
                <Button
                  variant="outline"
                  leftIcon={<FolderPlus size={16} />}
                  onClick={() => navigate(`/projects/create?groupId=${group.id}`)}
                >
                  Create Project
                </Button>
              )}
              <Button
                variant="outline"
                leftIcon={<Library size={16} />}
                onClick={() => navigate(`/groups/${group.id}/resources`)}
              >
                Resources
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Users size={20} className="text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-slate-800">Members</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {members.map((member) => (
                    <tr key={member.student_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {member.profile.avatar && (
                            <img 
                              className="h-8 w-8 rounded-full mr-3" 
                              src={member.profile.avatar} 
                              alt={member.profile.name} 
                            />
                          )}
                          <div className="text-sm font-medium text-slate-900">
                            {member.profile.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {member.profile.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-slate-500">
                        No members have joined this group yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Projects Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Group Projects</h2>
          {!isTeacher && (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/projects/new?group=${id}`)}
              leftIcon={<PlusCircle size={16} />}
            >
              New Project
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-slate-800">{project.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2 mt-1">{project.description}</p>
                <Button 
                  variant="link" 
                  className="mt-2 p-0" 
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  View Project
                </Button>
              </CardContent>
            </Card>
          ))}
          
          {projects.length === 0 && (
            <div className="md:col-span-3 bg-white rounded-lg border border-slate-200 p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-purple-100 rounded-full inline-block">
                  <FolderPlus size={24} className="text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">No projects yet</h3>
              <p className="text-slate-500 mb-4">Create a project for this group to get started.</p>
              {!isTeacher && (
                <Button 
                  onClick={() => navigate(`/projects/new?group=${id}`)}
                  leftIcon={<PlusCircle size={16} />}
                >
                  Create Project
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* SMART Goals Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Group SMART Goals</h2>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/goals/new?group=${id}`)}
            leftIcon={<PlusCircle size={16} />}
          >
            New SMART Goal
          </Button>
        </div>
        
        {goals.length > 0 ? (
          <CategorizedGoalsList 
            goals={goals} 
            getProjectTitle={(projectId) => projects.find(p => p.id === projectId)?.title || "Unknown Project"} 
          />
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="p-3 bg-green-100 rounded-full inline-block">
                <Target size={24} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No SMART goals yet</h3>
            <p className="text-slate-500 mb-4">Create SMART goals to track progress for this group.</p>
            <Button 
              onClick={() => navigate(`/goals/new?group=${id}`)}
              leftIcon={<PlusCircle size={16} />}
            >
              Create SMART Goal
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};
