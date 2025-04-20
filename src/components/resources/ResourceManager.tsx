import React, { useState } from 'react';
import { Link, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { supabase } from '../../lib/supabase';
import type { GroupResource } from '../../types';

interface ResourceManagerProps {
  groupId: string;
  teacherId: string;
  onResourceAdded: () => void;
}

export const ResourceManager: React.FC<ResourceManagerProps> = ({ 
  groupId, 
  teacherId,
  onResourceAdded
}) => {
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUrl('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!url.trim()) {
      setError('URL is required for the resource');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Determine the specific resource type based on the URL
      let specificResourceType: GroupResource['resource_type'] = 'link';
      
      if (url.includes('youtube.com') || url.includes('vimeo.com')) {
        specificResourceType = 'video';
      } else if (url.includes('.pdf')) {
        specificResourceType = 'article';
      } else if (url.includes('docs.google.com') || url.includes('sheets.google.com')) {
        specificResourceType = 'template';
      }

      // Create the resource record in the database
      const { error: resourceError } = await supabase
        .from('group_resources')
        .insert([
          {
            group_id: groupId,
            teacher_id: teacherId,
            title,
            description: description || null,
            resource_type: specificResourceType,
            url: url,
            file_path: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);

      if (resourceError) {
        throw resourceError;
      }

      // Reset form and notify parent component
      resetForm();
      setIsAddingResource(false);
      onResourceAdded();

    } catch (err: any) {
      console.error('Error adding resource:', err);
      setError(err.message || 'Failed to add resource');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-6">
      {!isAddingResource ? (
        <Button 
          onClick={() => setIsAddingResource(true)}
          leftIcon={<Plus size={16} />}
          variant="primary"
        >
          Add Resource
        </Button>
      ) : (
        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Add New Resource</h3>
              
              {/* Error Message */}
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              
              {/* Title */}
              <Input
                label="Resource Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this resource"
                required
              />
              
              {/* Description */}
              <Textarea
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe this resource"
                rows={3}
              />
              
              {/* URL Input */}
              <Input
                label="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/resource"
                required
              />
              
              <div className="mt-2 text-xs text-slate-500 flex items-center">
                <Link size={12} className="mr-1" />
                Share links to articles, videos, templates, or other helpful resources
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsAddingResource(false);
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading}
                >
                  {isUploading ? 'Adding...' : 'Add Resource'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
