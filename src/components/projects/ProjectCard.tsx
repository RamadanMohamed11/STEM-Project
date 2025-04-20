import React from 'react';
import { Link } from 'react-router-dom';
import { FolderCheck, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '../ui/Card';
import { CircularProgress } from '../ui/CircularProgress';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const calculateProgress = () => {
    // We'll implement this later when we have goals
    return 0;
  };

  const progress = calculateProgress();
  
  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
      <Link to={`/projects/${project.id}`}>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">
              {project.title}
            </h3>
            <CircularProgress 
              progress={progress} 
              size={48}
              color={progress >= 75 ? 'green' : progress >= 40 ? 'blue' : 'purple'}
            />
          </div>
          
          <p className="text-slate-600 text-sm mb-4 line-clamp-3">
            {project.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2.5 py-1">
              {project.category}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-slate-500">
              <FolderCheck size={16} className="mr-2 text-blue-600" />
              <span>0 Goals</span>
            </div>
            
            <div className="flex items-center text-sm text-slate-500">
              <Calendar size={16} className="mr-2 text-green-600" />
              <span>Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-slate-50 text-sm">
          <div className="flex w-full justify-between items-center">
            <span className="text-slate-500">
              Created {format(new Date(project.created_at), 'MMM d, yyyy')}
            </span>
            <span className="font-medium text-blue-600">View Project →</span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
};