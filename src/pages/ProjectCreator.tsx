import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Local interface for form state
interface ProjectForm {
  id?: string;
  user_id: string;
  group_id?: string;
  title: string;
  description: string;
  categories: string[];
  created_at?: string;
  updated_at?: string;
}

const categories = [
  'Science',
  'Technology',
  'Engineering',
  'Mathematics',
  'Research',
  'Innovation',
  'Other'
] as const;

export const ProjectCreator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  
  // Extract group_id from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  // Check for both 'group' and 'groupId' in URL parameters to handle different navigation paths
  const groupIdParam = queryParams.get('group') || queryParams.get('groupId');
  
  // Convert to UUID format if it's a valid UUID string
  const groupId = groupIdParam;
  
  console.log('Group ID from URL:', groupIdParam);
  
  const [project, setProject] = useState<ProjectForm>({
    user_id: user?.id || '',
    group_id: groupId || undefined,
    title: '',
    description: '',
    categories: [categories[0]]
  });

  // Validation rules
  const validation = {
    title: (value: string) => value.length >= 3 ? '' : 'Title must be at least 3 characters',
    description: (value: string) => value.length >= 10 ? '' : 'Description must be at least 10 characters',
    categories: (value: string[]) => value.length > 0 ? '' : 'Please select at least one category'
  } as const;

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Fetch group name if group_id is provided
  useEffect(() => {
    const fetchGroupName = async () => {
      if (groupId) {
        try {
          const { data, error } = await supabase
            .from('groups')
            .select('name')
            .eq('id', groupId)
            .single();
            
          if (error) throw error;
          if (data) setGroupName(data.name);
        } catch (err) {
          console.error('Error fetching group:', err);
        }
      }
    };
    
    fetchGroupName();
  }, [groupId]);

  const handleChange = (field: keyof ProjectForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setProject(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError(null);
  };
  
  // Handler for category checkbox changes
  const handleCategoryChange = (category: string) => {
    setProject(prev => {
      // If category is already selected, remove it, otherwise add it
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      
      return {
        ...prev,
        categories: newCategories
      };
    });
    setError(null);
  };

  const validateForm = (): boolean => {
    // Check title
    const titleError = validation.title(project.title);
    if (titleError) {
      setError(titleError);
      return false;
    }
    
    // Check description
    const descriptionError = validation.description(project.description);
    if (descriptionError) {
      setError(descriptionError);
      return false;
    }
    
    // Check categories
    const categoriesError = validation.categories(project.categories);
    if (categoriesError) {
      setError(categoriesError);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a project');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Convert categories array to a single category string (comma-separated)
      const categoryString = project.categories.join(', ');
      
      // Create a project object that matches the database schema
      const projectData = {
        title: project.title,
        description: project.description,
        user_id: user.id,
        category: categoryString, // Use single category string instead of array
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add group_id if it exists and is not empty
      if (groupId) {
        console.log('Adding group ID to project:', groupId);
        // @ts-ignore - Add group_id dynamically
        projectData.group_id = groupId;
      }
      
      console.log('Final project data being saved:', projectData);

      // Insert the project into Supabase
      try {
        const { data, error: supabaseError } = await supabase
          .from('projects')
          .insert([projectData])
          .select()
          .single();

        if (supabaseError) {
          console.error('Supabase error details:', supabaseError);
          throw supabaseError;
        }

        if (!data || !data.id) {
          throw new Error('Project was created but no ID was returned');
        }

        console.log('Project created successfully:', data);
        
        // Use a timeout to ensure the database has time to process the new record
        setTimeout(() => {
          navigate(`/projects/${data.id}`);
        }, 500);
      } catch (insertError) {
        console.error('Error during project creation:', insertError);
        throw insertError;
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err?.message || err?.error_description || 'Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg transition-all duration-300">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Project</h2>
      {groupName && (
        <p className="text-gray-600 mb-6">Creating project for group: <span className="font-semibold">{groupName}</span></p>
      )}
      {!groupId && (
        <p className="text-gray-600 mb-6">Creating a personal project</p>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 transition-all duration-300">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title
              <span className="text-xs text-gray-500 ml-2">Give your project a descriptive name</span>
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
              value={project.title}
              onChange={handleChange('title')}
              placeholder="Enter project title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
              <span className="text-xs text-gray-500 ml-2">Select one or more focus areas</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {categories.map(category => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={project.categories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`category-${category}`} className="ml-2 block text-sm text-gray-700">
                    {category}
                  </label>
                </div>
              ))}
            </div>
            {project.categories.length > 0 && (
              <div className="mt-3 p-2 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Selected:</span> {project.categories.join(', ')}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
              <span className="text-xs text-gray-500 ml-2">Describe your project's goals and objectives</span>
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
              value={project.description}
              onChange={handleChange('description')}
              rows={4}
              placeholder="Enter project description..."
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2 transition-all duration-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Project...' : 'Create Project'}
        </button>
      </form>
    </div>
  );
};
