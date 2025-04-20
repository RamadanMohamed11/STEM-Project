import React, { useState, useEffect } from 'react';
import { 
  File, Link, Video, BookOpen, FileText, ExternalLink, 
  Download, Trash2, Calendar 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { GroupResource } from '../../types';

interface ResourceListProps {
  groupId: string;
  isTeacher: boolean;
  refreshTrigger?: number;
}

export const ResourceList: React.FC<ResourceListProps> = ({ 
  groupId, 
  isTeacher,
  refreshTrigger = 0
}) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if the table exists by trying to get the count
        const { error: countError } = await supabase
          .from('group_resources')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId);

        if (countError) {
          if (countError.code === '42P01') { // Table doesn't exist error
            throw new Error('Resource table not found. Database migration may not have been applied.');
          }
          throw countError;
        }

        // Now fetch the actual resources
        const { data, error: fetchError } = await supabase
          .from('group_resources')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        setResources(data || []);
      } catch (err: any) {
        console.error('Error fetching resources:', err);
        // Provide more specific error messages
        if (err.message?.includes('migration')) {
          setError(err.message);
        } else if (err.code === 'PGRST116') {
          setError('Resource table not found. Please ensure database migrations are applied.');
        } else if (err.code === '42501') {
          setError('Permission denied. You may not have access to view these resources.');
        } else {
          setError(`Failed to load resources: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [groupId, refreshTrigger]);

  const handleDelete = async (resourceId: string) => {
    if (!user || !isTeacher) return;
    
    try {
      setDeletingId(resourceId);
      
      // Find the resource to get the file path if it exists
      const resourceToDelete = resources.find(r => r.id === resourceId);
      
      // Delete the file from storage if it exists
      if (resourceToDelete?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('group_resources')
          .remove([resourceToDelete.file_path]);
          
        if (storageError) {
          console.error('Error deleting file:', storageError);
          // Continue anyway to delete the database record
        }
      }
      
      // Delete the resource record
      const { error: deleteError } = await supabase
        .from('group_resources')
        .delete()
        .eq('id', resourceId);
        
      if (deleteError) throw deleteError;
      
      // Update the local state
      setResources(resources.filter(r => r.id !== resourceId));
      
    } catch (err: any) {
      console.error('Error deleting resource:', err);
      setError('Failed to delete resource');
    } finally {
      setDeletingId(null);
    }
  };

  const getResourceIcon = (resource: GroupResource) => {
    switch (resource.resource_type) {
      case 'file':
        return <File size={20} className="text-blue-600" />;
      case 'link':
        return <Link size={20} className="text-purple-600" />;
      case 'template':
        return <FileText size={20} className="text-green-600" />;
      case 'video':
        return <Video size={20} className="text-red-600" />;
      case 'article':
        return <BookOpen size={20} className="text-amber-600" />;
      default:
        return <File size={20} className="text-slate-600" />;
    }
  };

  const handleResourceClick = async (resource: GroupResource) => {
    // For links, open in a new tab
    if (resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For files, download the file
    if (resource.file_path) {
      try {
        // Get a signed URL for the file
        const { data, error } = await supabase.storage
          .from('group_resources')
          .createSignedUrl(resource.file_path, 60); // 60 seconds expiry
          
        if (error) throw error;
        
        // Open the signed URL in a new tab
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.error('Error accessing file:', err);
        setError('Failed to access file');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading resources...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <div className="font-medium mb-2">Error loading resources:</div>
        <div>{error}</div>
        {error.includes('bucket') && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded border border-blue-200">
            <div className="font-medium mb-1">Troubleshooting:</div>
            <ul className="list-disc pl-5 text-sm">
              <li className="mb-1">Make sure the database migrations have been applied</li>
              <li className="mb-1">Check if the storage bucket 'group_resources' exists in Supabase</li>
              <li className="mb-1">Try refreshing the page</li>
              <li>If the problem persists, contact your administrator</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex justify-center mb-3">
          <FileText size={48} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">No Resources Yet</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          {isTeacher 
            ? "Add resources to help your students with their STEM projects." 
            : "Your teacher hasn't added any resources yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resources.map(resource => (
        <Card key={resource.id} className="hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div 
                className="flex items-start flex-1 cursor-pointer"
                onClick={() => handleResourceClick(resource)}
              >
                <div className="p-2 mr-3 bg-slate-100 rounded-md">
                  {getResourceIcon(resource)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-800 flex items-center">
                    {resource.title}
                    {resource.url && (
                      <ExternalLink size={14} className="ml-1 text-slate-400" />
                    )}
                  </h3>
                  {resource.description && (
                    <p className="text-sm text-slate-600 mt-1">{resource.description}</p>
                  )}
                  <div className="flex items-center mt-2 text-xs text-slate-500">
                    <Calendar size={12} className="mr-1" />
                    Added {new Date(resource.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {resource.file_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResourceClick(resource)}
                    leftIcon={<Download size={14} />}
                  >
                    Download
                  </Button>
                )}
                
                {isTeacher && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(resource.id)}
                    disabled={deletingId === resource.id}
                    leftIcon={<Trash2 size={14} />}
                  >
                    {deletingId === resource.id ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
