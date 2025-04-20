import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';
import { CircularProgress } from '../ui/CircularProgress';
import { MessageSquare, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { SmartGoal } from '../../types';

interface SmartGoalCardProps {
  goal: SmartGoal;
  projectTitle: string;
}

export const SmartGoalCard: React.FC<SmartGoalCardProps> = ({ goal, projectTitle }) => {
  // Function to render the approval status badge
  const renderStatusBadge = () => {
    switch (goal.approval_status) {
      case 'approved':
        return (
          <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
            <XCircle size={12} className="mr-1" />
            Needs Revision
          </div>
        );
      default:
        return (
          <div className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            <AlertCircle size={12} className="mr-1" />
            Pending Review
          </div>
        );
    }
  };

  return (
    <Card className="h-full hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-slate-800">{goal.title}</h3>
              {renderStatusBadge()}
            </div>
            <p className="text-sm text-slate-600">{projectTitle}</p>
          </div>
          <CircularProgress progress={goal.progress} size={40} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-700">Specific</h4>
            <p className="text-sm text-slate-600">{goal.specific}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">Measurable</h4>
            <p className="text-sm text-slate-600">{goal.measurable}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">Achievable</h4>
            <p className="text-sm text-slate-600">{goal.achievable}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">Relevant</h4>
            <p className="text-sm text-slate-600">{goal.relevant}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700">Time-bound</h4>
            <p className="text-sm text-slate-600">
              {new Date(goal.time_bound_start).toLocaleDateString()} to {new Date(goal.time_bound_end).toLocaleDateString()}
            </p>
          </div>
          
          {/* Teacher Feedback Section */}
          {goal.teacher_feedback && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-700 flex items-center gap-1">
                <MessageSquare size={16} />
                Teacher Feedback
              </h4>
              <p className="text-sm text-slate-700 mt-1">{goal.teacher_feedback}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="text-xs text-slate-500">
          Last updated: {new Date(goal.updated_at).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
};