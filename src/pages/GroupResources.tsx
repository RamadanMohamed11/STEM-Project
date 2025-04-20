import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { ResourceManager } from '../components/resources/ResourceManager';
import { ResourceList } from '../components/resources/ResourceList';

export const GroupResources: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user || !id) {
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
          .select('name, teacher_id')
          .eq('id', id)
          .single();

        if (groupError) throw groupError;
        
        setGroupName(groupData.name);
        setIsTeacher(groupData.teacher_id === user.id);

      } catch (err: any) {
        console.error('Error fetching group details:', err);
        setError(err.message || 'Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [id, user, navigate]);

  const handleResourceAdded = () => {
    // Increment the refresh trigger to reload the resource list
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-slate-700 mb-6">{error}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          onClick={() => navigate(`/groups/${id}`)}
          className="mr-4"
          leftIcon={<ArrowLeft size={16} />}
        >
          Back to Group
        </Button>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Library className="mr-2 text-blue-600" size={24} />
          Resources for {groupName}
        </h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Shared Resources</h2>
          <p className="text-slate-600">
            {isTeacher 
              ? "Share helpful resources, templates, or references with your students."
              : "Resources shared by your teacher to help with your STEM projects."}
          </p>
        </div>

        {isTeacher && (
          <ResourceManager 
            groupId={id || ''} 
            teacherId={user?.id || ''} 
            onResourceAdded={handleResourceAdded}
          />
        )}

        <ResourceList 
          groupId={id || ''} 
          isTeacher={isTeacher}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
};
