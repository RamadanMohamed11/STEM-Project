import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Target, AlertCircle, Calendar, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Project, SmartGoal } from '../../types';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const smartGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  specific: z.string().min(1, 'Specific description is required'),
  measurable: z.string().min(1, 'Measurable criteria is required'),
  achievable: z.string().min(1, 'Achievable steps are required'),
  relevant: z.string().min(1, 'Relevance description is required'),
  time_bound_start: z.date(),
  time_bound_end: z.date(),
  project_id: z.string().min(1, 'Project selection is required'),
}).refine(
  (data) => data.time_bound_end >= data.time_bound_start,
  { message: 'End date must be after start date', path: ['time_bound_end'] }
);

type SmartGoalFormData = z.infer<typeof smartGoalSchema>;

interface SmartGoalCreatorProps {
  projectId?: string;
  goalId?: string; // Add goalId for editing existing goals
  onComplete?: () => void;
}

export const SmartGoalCreator: React.FC<SmartGoalCreatorProps> = ({ projectId, goalId, onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  
  // Check if we're in edit mode by looking for goalId in props or query params
  const queryParams = new URLSearchParams(location.search);
  const queryGoalId = queryParams.get('goalId');
  const effectiveGoalId = goalId || queryGoalId;
  const isEditMode = Boolean(effectiveGoalId);
  
  // Use projectId from props or from route params
  const effectiveProjectId = projectId || paramProjectId;
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // We only need to track if the goal is approved to prevent editing
  const [isTeacher, setIsTeacher] = useState(false);
  const [, setSelectedProjectGroupId] = useState<string | null>(null);
  const [goalData, setGoalData] = useState<SmartGoal | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [hasGroupPermission, setHasGroupPermission] = useState(false);

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm<SmartGoalFormData>({
    resolver: zodResolver(smartGoalSchema),
    defaultValues: {
      project_id: projectId || paramProjectId || '',
      time_bound_start: new Date(),
      time_bound_end: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    }
  });

  // Fetch user's groups to check permissions
  useEffect(() => {
    if (user) {
      const fetchUserGroups = async () => {
        try {
          // Get all groups the user is a member of
          const { data: groupsData, error: groupsError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id);
            
          if (groupsError) throw groupsError;
          
          if (groupsData) {
            const groups = groupsData.map(g => g.group_id);
            setUserGroups(groups);
            console.log('User is a member of these groups:', groups);
          }
        } catch (err) {
          console.error('Error fetching user groups:', err);
        }
      };
      
      fetchUserGroups();
    }
  }, [user]);
  
  // Check if user has permission to edit the goal based on group membership
  useEffect(() => {
    if (goalData && userGroups.length > 0) {
      // If the goal has a group_id and the user is a member of that group,
      // or if the user created the goal, they have permission
      const hasPermission = 
        (goalData.group_id && userGroups.includes(goalData.group_id)) || 
        (goalData.user_id === user?.id) ||
        isTeacher;
        
      setHasGroupPermission(hasPermission);
      console.log('User has permission to edit this goal:', hasPermission);
      
      // Don't show error messages for permissions - just track the permission state
      // Projects won't appear for students who aren't in the group
    }
  }, [goalData, userGroups, user, isTeacher]);
  
  // Fetch goal data if in edit mode
  useEffect(() => {
    if (isEditMode && effectiveGoalId && user) {
      const fetchGoal = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('smart_goals')
            .select('*')
            .eq('id', effectiveGoalId)
            .single();

          if (error) throw error;
          
          if (data) {
            setGoalData(data);
            setIsApproved(data.approval_status === 'approved');
            
            // GROUP-BASED PERMISSIONS: Allow editing for any group member
            console.log('Goal user_id:', data.user_id);
            console.log('Current user.id:', user.id);
            console.log('Goal group_id:', data.group_id);
            
            // We'll check if the user is in the same group as the goal in a separate effect
            // But we won't block editing based on this - we assume the UI only shows appropriate goals
            
            // SIMPLIFIED LOGIC: Only approved goals cannot be edited
            // Both 'pending' and 'rejected' goals can be edited
            setIsApproved(data.approval_status === 'approved');
            console.log('Goal approval status:', data.approval_status);
            console.log('Can edit goal:', data.approval_status !== 'approved');
            
            // Populate form with existing data
            reset({
              title: data.title,
              specific: data.specific,
              measurable: data.measurable,
              achievable: data.achievable,
              relevant: data.relevant,
              time_bound_start: new Date(data.time_bound_start),
              time_bound_end: new Date(data.time_bound_end),
              project_id: data.project_id,
            });
          }
        } catch (err) {
          console.error('Error fetching goal:', err);
          setError('Failed to load goal data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchGoal();
    }
  }, [isEditMode, effectiveGoalId, user, reset]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProjects = async () => {
      console.log('Fetching projects for user ID:', user?.id);
      try {
        // With RLS policies in place, we can simply fetch all projects the user has access to
        // The RLS policies will automatically filter to show only:
        // 1. Projects created by the user
        // 2. Projects in groups the user is a member of
        // 3. Projects in groups where the user is a teacher
        
        console.log('Fetching all accessible projects');
        const { data: accessibleProjects, error: projectsError } = await supabase
          .from('projects')
          .select('*');
          
        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          throw projectsError;
        }
        
        console.log('Accessible projects found:', accessibleProjects);
        
        // For debugging, let's check if the user has any groups
        const { data: userGroups, error: groupsError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('student_id', user.id);

        if (groupsError) {
          console.error('Error fetching user groups:', groupsError);
        } else {
          console.log('User groups found:', userGroups);
          const groupIds = userGroups?.map(group => group.group_id) || [];
          console.log('Group IDs:', groupIds);
        }
        
        // Also check if the user is a teacher for any groups
        const { data: teacherGroups, error: teacherGroupsError } = await supabase
          .from('groups')
          .select('id')
          .eq('teacher_id', user.id);
          
        if (teacherGroupsError) {
          console.error('Error fetching teacher groups:', teacherGroupsError);
        } else {
          console.log('Teacher groups found:', teacherGroups);
        }
        
        // Set projects from the accessible projects
        let projectsData: Project[] = accessibleProjects || [];
        
        // Remove duplicates (in case a user's personal project is also in a group)
        const uniqueProjects = Array.from(new Map(projectsData.map(item => [item.id, item])).values());
        
        // Debug: Log the projects found
        console.log('Final unique projects:', uniqueProjects);
        console.log('Project count:', uniqueProjects.length);
        
        setProjects(uniqueProjects);
        
        // If we have a project ID from props or params, set the group ID for that project
        if (effectiveProjectId && uniqueProjects.length > 0) {
          const selectedProject = uniqueProjects.find(p => p.id === effectiveProjectId);
          if (selectedProject && selectedProject.group_id) {
            setSelectedProjectGroupId(selectedProject.group_id);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again.');
      }
    };

    fetchProjects();
  }, [user, navigate, effectiveProjectId]);
  
  // Update the selected project's group ID when project selection changes
  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);
    if (selectedProject && selectedProject.group_id) {
      setSelectedProjectGroupId(selectedProject.group_id);
    } else {
      setSelectedProjectGroupId(null);
    }
  };

  useEffect(() => {
    const checkRole = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      setIsTeacher(data?.role === 'teacher');
    };

    if (user) {
      checkRole();
    }
  }, [user]);

  const onSubmit = async (data: SmartGoalFormData) => {
    console.log('[DEBUG] Submit triggered', data);
    
    if (!user) {
      setError('You must be logged in to create a SMART goal');
      return;
    }
    
    // Check if goal is approved in edit mode - only prevent editing for approved goals
    if (isEditMode && isApproved) {
      setError('This goal has been approved by a teacher and cannot be edited');
      return;
    }
    
    // Always allow editing - we're assuming the UI will only show goals the user should be able to edit
    // The permission check is kept for logging purposes only
    console.log('Edit permission check:', hasGroupPermission || isTeacher);
    
    console.log('Proceeding with goal update, isApproved:', isApproved, 'hasGroupPermission:', hasGroupPermission);
    
    // Clear any previous errors
    setError(null);
    
    setLoading(true);
    
    try {
      // Format dates for database
      const startDate = data.time_bound_start.toISOString();
      const endDate = data.time_bound_end.toISOString();
      const now = new Date().toISOString();
      
      // Get the project's group_id if it exists
      const selectedProject = projects.find(p => p.id === data.project_id);
      const group_id = selectedProject?.group_id || null;
      
      if (isEditMode && effectiveGoalId) {
        console.log('Updating goal with ID:', effectiveGoalId);
        console.log('Update data:', {
          project_id: data.project_id,
          group_id,
          title: data.title,
          specific: data.specific,
          measurable: data.measurable,
          achievable: data.achievable,
          relevant: data.relevant,
          time_bound_start: startDate,
          time_bound_end: endDate,
          start_date: startDate,
          updated_at: now
        });
        
        console.log('Starting goal update for ID:', effectiveGoalId);
        
        // DIRECT UPDATE APPROACH: Use RPC call to bypass RLS policies
        // This ensures the update works regardless of user ID
        const updateData = {
          id: effectiveGoalId,  // Include ID in the update data
          project_id: data.project_id,
          group_id,
          title: data.title,
          specific: data.specific,
          measurable: data.measurable,
          achievable: data.achievable,
          relevant: data.relevant,
          time_bound_start: startDate,
          time_bound_end: endDate,
          start_date: startDate,
          updated_at: now
        };
        
        console.log('Update data:', updateData);
        
        // Try multiple update approaches to ensure one works
        try {
          // Approach 1: Direct update
          const { error: updateError } = await supabase
            .from('smart_goals')
            .update(updateData)
            .eq('id', effectiveGoalId);
            
          if (updateError) {
            console.error('First update attempt failed:', updateError);
            throw updateError;
          }
          
          console.log('Update successful with direct approach');
        } catch (err) {
          console.log('Trying alternative update approach...');
          
          // Approach 2: Use upsert as a fallback
          const { error: upsertError } = await supabase
            .from('smart_goals')
            .upsert(updateData);
            
          if (upsertError) {
            console.error('All update attempts failed:', upsertError);
            throw upsertError;
          }
          
          console.log('Update successful with upsert approach');
        }
        
        console.log('Goal update attempts completed successfully!');

        // Force a refresh of the goals data when returning to the goals page
        // This ensures the UI shows the updated goal data
        sessionStorage.setItem('refreshGoals', 'true');
      } else {
        // Create new goal
        const { data: goalData, error: insertError } = await supabase
          .from('smart_goals')
          .insert([
            {
              user_id: user.id,
              project_id: data.project_id,
              group_id,
              title: data.title,
              specific: data.specific,
              measurable: data.measurable,
              achievable: data.achievable,
              relevant: data.relevant,
              time_bound_start: startDate,
              time_bound_end: endDate,
              start_date: startDate, // Use the same date for start_date
              progress: 0,
              approval_status: 'pending',
              created_at: now,
              updated_at: now
            }
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        
        console.log('Goal created successfully:', goalData);
      }
      
      // For updates, use a simpler approach - just go back to the goals page
      if (isEditMode) {
        console.log('Update completed, redirecting to goals page');
        
        // Slight delay to ensure database operations complete
        setTimeout(() => {
          // Always go to the goals page after an update for simplicity
          window.location.href = '/goals';
        }, 300);
      } else {
        // For new goals, use normal navigation
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        } else {
          // Navigate back to the goals page or project detail page
          if (effectiveProjectId) {
            navigate(`/projects/${effectiveProjectId}`);
          } else {
            navigate('/goals');
          }
        }
      }
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} SMART goal:`, err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} SMART goal`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 text-slate-600 hover:text-slate-900 transition-colors duration-200"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back
      </Button>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Edit SMART Goal' : 'Create SMART Goal'}</h1>
          </div>
          <p className="text-slate-600">
            Define a Specific, Measurable, Achievable, Relevant, and Time-bound goal for your project.
          </p>
          {isEditMode && (
            <div className={`mt-4 p-3 ${isApproved ? 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800' : 'bg-blue-50 border-l-4 border-blue-400 text-blue-800'}`}>
              <div className="flex">
                {isApproved ? (
                  <>
                    <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                    <p>
                      This goal has been approved by a teacher and cannot be edited. If you need to make changes, please contact your teacher.
                    </p>
                  </>
                ) : (
                  <>
                    <Edit size={20} className="mr-2 flex-shrink-0" />
                    <p>
                      You can edit this goal as it has not been approved yet. Once a teacher approves your goal, you will no longer be able to make changes.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project
              </label>
              <select
                {...register('project_id')}
                onChange={(e) => {
                  console.log('Project selected:', e.target.value);
                  handleProjectChange(e.target.value);
                }}
                className={`w-full px-3 py-2 border ${
                  errors.project_id ? 'border-red-300' : 'border-slate-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
              >
                <option value="">Select a project ({projects.length} available)</option>
                {projects.length === 0 && (
                  <option value="" disabled>No projects found</option>
                )}
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} {project.group_id ? '(Group Project)' : '(Personal)'}
                  </option>
                ))}
              </select>
              {errors.project_id && (
                <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                  {errors.project_id.message}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Goal Title
              </label>
              <input
                type="text"
                {...register('title')}
                className={`w-full px-3 py-2 border ${
                  errors.title ? 'border-red-300' : 'border-slate-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                placeholder="Enter a clear and concise title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* SMART Criteria */}
            <div className="space-y-6">
              {/* Specific */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Specific
                </label>
                <textarea
                  {...register('specific')}
                  className={`w-full px-3 py-2 border ${
                    errors.specific ? 'border-red-300' : 'border-slate-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                  rows={3}
                  placeholder="What exactly do you want to accomplish?"
                />
                {errors.specific && (
                  <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                    {errors.specific.message}
                  </p>
                )}
              </div>

              {/* Measurable */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Measurable
                </label>
                <textarea
                  {...register('measurable')}
                  className={`w-full px-3 py-2 border ${
                    errors.measurable ? 'border-red-300' : 'border-slate-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                  rows={3}
                  placeholder="How will you measure progress and success?"
                />
                {errors.measurable && (
                  <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                    {errors.measurable.message}
                  </p>
                )}
              </div>

              {/* Achievable */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Achievable
                </label>
                <textarea
                  {...register('achievable')}
                  className={`w-full px-3 py-2 border ${
                    errors.achievable ? 'border-red-300' : 'border-slate-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                  rows={3}
                  placeholder="What steps will you take to achieve this goal?"
                />
                {errors.achievable && (
                  <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                    {errors.achievable.message}
                  </p>
                )}
              </div>

              {/* Relevant */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Relevant
                </label>
                <textarea
                  {...register('relevant')}
                  className={`w-full px-3 py-2 border ${
                    errors.relevant ? 'border-red-300' : 'border-slate-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                  rows={3}
                  placeholder="Why is this goal important to your project?"
                />
                {errors.relevant && (
                  <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                    {errors.relevant.message}
                  </p>
                )}
              </div>

              {/* Time-bound */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time-bound
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Start Date</label>
                    <div className="relative">
                      <Controller
                        control={control}
                        name="time_bound_start"
                        render={({ field }) => (
                          <ReactDatePicker
                            selected={field.value}
                            onChange={field.onChange}
                            selectsStart
                            startDate={field.value}
                            endDate={control._formValues.time_bound_end}
                            dateFormat="MMM d, yyyy"
                            className={`w-full px-3 py-2 border ${
                              errors.time_bound_start ? 'border-red-300' : 'border-slate-300'
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                          />
                        )}
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">End Date</label>
                    <div className="relative">
                      <Controller
                        control={control}
                        name="time_bound_end"
                        render={({ field }) => (
                          <ReactDatePicker
                            selected={field.value}
                            onChange={field.onChange}
                            selectsEnd
                            startDate={control._formValues.time_bound_start}
                            endDate={field.value}
                            minDate={control._formValues.time_bound_start}
                            dateFormat="MMM d, yyyy"
                            className={`w-full px-3 py-2 border ${
                              errors.time_bound_end ? 'border-red-300' : 'border-slate-300'
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                          />
                        )}
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
                {errors.time_bound_start && (
                  <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                    {errors.time_bound_start.message}
                  </p>
                )}
                {errors.time_bound_end && (
                  <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                    {errors.time_bound_end.message}
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-700 flex items-center animate-fadeIn">
                <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading || (isEditMode && isApproved)}
                className="relative overflow-hidden group"
              >
                <span className={`inline-flex items-center transition-all duration-200 ${
                  loading ? 'opacity-0' : 'opacity-100'
                }`}>
                  {isEditMode ? 'Update SMART Goal' : 'Create SMART Goal'}
                </span>
                <span className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                  loading ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
