import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ArrowRight, Check, Calendar, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const steps = [
  { id: 'specific', label: 'Specific', description: 'What exactly do you want to accomplish?' },
  { id: 'measurable', label: 'Measurable', description: 'How will you know when you\'ve achieved it?' },
  { id: 'achievable', label: 'Achievable', description: 'Is it realistic and attainable?' },
  { id: 'relevant', label: 'Relevant', description: 'Does it align with your STEM project goals?' },
  { id: 'time-bound', label: 'Time-bound', description: 'What\'s your deadline?' },
  { id: 'review', label: 'Review', description: 'Review your SMART goal' },
];

interface Project {
  id: string;
  title: string;
  description: string;
  user_id: string;
  group_id?: string;
  category: string;
  created_at: string;
}

export const CreateSmartGoal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>('');

  // Extract group_id from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const groupId = queryParams.get('group');

  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    startDate: '',
    endDate: '',
    group_id: groupId || undefined,
  });

  // Fetch projects for the user and/or group
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        setLoading(true);
        let query = supabase.from('projects').select('*');

        if (groupId) {
          // If group_id is provided, fetch projects for this group
          query = query.eq('group_id', groupId);

          // Also fetch the group name
          const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('name')
            .eq('id', groupId)
            .single();

          if (!groupError && groupData) {
            setGroupName(groupData.name);
          }
        } else {
          // Otherwise fetch user's personal projects
          query = query.eq('user_id', user.id).is('group_id', null);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, groupId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create a goal');
      return;
    }

    try {
      setLoading(true);

      const goalData = {
        title: formData.title,
        specific: formData.specific,
        measurable: formData.measurable,
        achievable: formData.achievable,
        relevant: formData.relevant,
        start_date: formData.startDate,
        end_date: formData.endDate,
        progress: 0,
        user_id: user.id,
        project_id: formData.projectId || null,
        group_id: groupId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('smart_goals')
        .insert([goalData])
        .select('*')
        .single();

      if (error) throw error;

      console.log('SMART goal created successfully:', data);

      // Navigate back to the group detail page if we came from there
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        navigate('/goals');
      }
    } catch (err: any) {
      console.error('Error creating SMART goal:', err);
      setError(err.message || 'Failed to create SMART goal');
    } finally {
      setLoading(false);
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 0: // Specific
        return formData.title.trim() !== '' && formData.projectId !== '' && formData.specific.trim() !== '';
      case 1: // Measurable
        return formData.measurable.trim() !== '';
      case 2: // Achievable
        return formData.achievable.trim() !== '';
      case 3: // Relevant
        return formData.relevant.trim() !== '';
      case 4: // Time-bound
        return formData.startDate !== '' && formData.endDate !== '';
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Specific
        return (
          <div className="space-y-6">
            <Input
              label="Goal Title"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Build a functional robot prototype"
              required
              fullWidth
            />

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 mb-1">
                Associated Project
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                className="block w-full px-4 py-2 rounded-md shadow-sm border border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="specific" className="block text-sm font-medium text-slate-700 mb-1">
                Specific Description
              </label>
              <textarea
                id="specific"
                name="specific"
                rows={4}
                value={formData.specific}
                onChange={handleInputChange}
                placeholder="Describe exactly what you want to accomplish. Be clear and detailed."
                className="block w-full px-4 py-2 rounded-md shadow-sm border border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <Info size={20} className="text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Tips for being specific:</h4>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Use clear and precise language</li>
                    <li>Identify exactly what you want to accomplish</li>
                    <li>Include who, what, where, when, why, and how</li>
                    <li>Avoid vague or ambiguous terms</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Measurable
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="measurable" className="block text-sm font-medium text-slate-700 mb-1">
                Measurable Criteria
              </label>
              <textarea
                id="measurable"
                name="measurable"
                rows={4}
                value={formData.measurable}
                onChange={handleInputChange}
                placeholder="Define the metrics you'll use to measure progress and success."
                className="block w-full px-4 py-2 rounded-md shadow-sm border border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <Info size={20} className="text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Tips for making it measurable:</h4>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Include quantities, metrics, or data points</li>
                    <li>Ask: How much? How many? How will I know it's accomplished?</li>
                    <li>Define what success looks like</li>
                    <li>Create milestones to track progress</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md border border-slate-200">
              <h4 className="text-sm font-medium text-slate-800 mb-2">Examples:</h4>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>
                  <strong>Weak:</strong> "Improve robot performance"
                </li>
                <li>
                  <strong>Strong:</strong> "Increase robot navigation accuracy from 70% to 95% through 50 test runs"
                </li>
              </ul>
            </div>
          </div>
        );

      case 2: // Achievable
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="achievable" className="block text-sm font-medium text-slate-700 mb-1">
                Achievability Assessment
              </label>
              <textarea
                id="achievable"
                name="achievable"
                rows={4}
                value={formData.achievable}
                onChange={handleInputChange}
                placeholder="Explain why this goal is realistically achievable with your resources and constraints."
                className="block w-full px-4 py-2 rounded-md shadow-sm border border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <Info size={20} className="text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Tips for ensuring achievability:</h4>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Consider your available resources (time, equipment, skills)</li>
                    <li>Be realistic about constraints</li>
                    <li>Identify what additional resources you might need</li>
                    <li>Consider your team's capacity and expertise</li>
                    <li>Break down complex goals into smaller achievable steps</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Relevant
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="relevant" className="block text-sm font-medium text-slate-700 mb-1">
                Relevance to Project
              </label>
              <textarea
                id="relevant"
                name="relevant"
                rows={4}
                value={formData.relevant}
                onChange={handleInputChange}
                placeholder="Explain how this goal aligns with your overall STEM project objectives and curriculum."
                className="block w-full px-4 py-2 rounded-md shadow-sm border border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <Info size={20} className="text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Tips for ensuring relevance:</h4>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Connect the goal to your larger STEM project</li>
                    <li>Explain how it relates to your learning objectives</li>
                    <li>Consider how it builds useful skills or knowledge</li>
                    <li>Ask: "Does this matter to our project's success?"</li>
                    <li>Consider how it addresses real-world problems or needs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Time-bound
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                name="startDate"
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                leftIcon={<Calendar size={16} />}
                required
                fullWidth
              />

              <Input
                label="Target Completion Date"
                name="endDate"
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                leftIcon={<Calendar size={16} />}
                required
                fullWidth
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <Info size={20} className="text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Tips for time-bound goals:</h4>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Set a clear deadline</li>
                    <li>Create intermediate milestones</li>
                    <li>Consider project constraints and dependencies</li>
                    <li>Allow buffer time for unexpected challenges</li>
                    <li>Be realistic about the time required</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 5: // Review
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Review Your SMART Goal</h3>
            <ul className="list-disc ml-6 text-slate-700">
              <li>
                <strong>Title:</strong> {formData.title}
              </li>
              <li>
                <strong>Project:</strong> {projects.find(p => p.id === formData.projectId)?.title || 'N/A'}
              </li>
              <li>
                <strong>Specific:</strong> {formData.specific}
              </li>
              <li>
                <strong>Measurable:</strong> {formData.measurable}
              </li>
              <li>
                <strong>Achievable:</strong> {formData.achievable}
              </li>
              <li>
                <strong>Relevant:</strong> {formData.relevant}
              </li>
              <li>
                <strong>Start Date:</strong> {formData.startDate}
              </li>
              <li>
                <strong>End Date:</strong> {formData.endDate}
              </li>
            </ul>
          </div>
        );

      default:
        return null;
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {groupName && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-medium text-blue-800">Creating SMART Goal for Group: {groupName}</h2>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <Link to="/goals" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
            <ArrowLeft size={16} className="mr-1" />
            Back to Goals
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Create SMART Goal</h1>
          <p className="text-slate-600">
            Follow the steps to create a well-defined SMART goal for your STEM project.
          </p>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  index <= currentStep ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {index < currentStep ? <Check size={16} /> : <span>{index + 1}</span>}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.label}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-between">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`w-5 h-5 ${index < steps.length - 1 ? 'bg-white' : 'bg-transparent'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">{steps[currentStep].label}</h2>
            <p className="text-slate-600 text-sm">{steps[currentStep].description}</p>
          </CardHeader>

          <CardContent className="py-6">
            <form onSubmit={handleSubmit}>
              {renderStepContent()}
            </form>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              leftIcon={<ArrowLeft size={16} />}
            >
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepComplete()}
                rightIcon={<ArrowRight size={16} />}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" rightIcon={<Check size={16} />}>
                Create Goal
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};