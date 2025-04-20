import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Target, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Project } from '../../types';
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
  onComplete?: () => void;
}

export const SmartGoalCreator: React.FC<SmartGoalCreatorProps> = ({ projectId, onComplete }) => {
  const navigate = useNavigate();
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  
  // Use projectId from props or from route params
  const effectiveProjectId = projectId || paramProjectId;
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [selectedProjectGroupId, setSelectedProjectGroupId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, control } = useForm<SmartGoalFormData>({
    resolver: zodResolver(smartGoalSchema),
    defaultValues: {
      project_id: projectId || paramProjectId || '',
      time_bound_start: new Date(),
      time_bound_end: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;
        setProjects(data || []);
        
        // If we have a project ID from props or params, set the group ID for that project
        if (effectiveProjectId && data) {
          const selectedProject = data.find(p => p.id === effectiveProjectId);
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
      console.error('[DEBUG] No user found');
      setError('You must be logged in to create a SMART goal.');
      return;
    }
    
    if (!data.project_id) {
      console.warn('[DEBUG] No project selected');
      setError('Please select a project.');
      return;
    }

    try {
      console.log('[DEBUG] Starting submission');
      setLoading(true);
      setError(null);

      // Get the selected project to determine its group_id
      const selectedProject = projects.find(p => p.id === data.project_id);
      
      const { error: insertError } = await supabase
        .from('smart_goals')
        .insert([
          {
            title: data.title,
            specific: data.specific,
            measurable: data.measurable,
            achievable: data.achievable,
            relevant: data.relevant,
            time_bound_start: data.time_bound_start.toISOString(),
            time_bound_end: data.time_bound_end.toISOString(),
            project_id: data.project_id,
            group_id: selectedProject?.group_id || null, // Include the group_id
            user_id: user?.id,
            progress: 0,
            approval_status: 'pending', // Set default approval status
          }
        ]);

      console.log('[DEBUG] Supabase response:', { insertError });

      if (insertError) {
        console.error('[DEBUG] Supabase error:', insertError);
        setError(`Failed to create goal: ${insertError.message}`);
        return;
      }

      console.log('[DEBUG] Submission successful');
      if (onComplete) {
        console.log('[DEBUG] Calling onComplete');
        onComplete();
      } else {
        navigate('/goals');
        // Optional: Show toast message
        // toast.success('SMART goal created successfully!');
      }

    } catch (error) {
      console.error('[DEBUG] General error:', error);
    } finally {
      console.log('[DEBUG] Finalizing state');
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
            <h1 className="text-2xl font-bold text-slate-800">Create SMART Goal</h1>
          </div>
          <p className="text-slate-600">
            Define your goal using the SMART criteria: Specific, Measurable, Achievable, Relevant, and Time-bound
          </p>
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
                onChange={(e) => handleProjectChange(e.target.value)}
                className={`w-full px-3 py-2 border ${
                  errors.project_id ? 'border-red-300' : 'border-slate-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
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
                disabled={loading}
                className="relative overflow-hidden group"
              >
                <span className={`inline-flex items-center transition-all duration-200 ${
                  loading ? 'opacity-0' : 'opacity-100'
                }`}>
                  Create SMART Goal
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
