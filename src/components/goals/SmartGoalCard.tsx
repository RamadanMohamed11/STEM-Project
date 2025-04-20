import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';
import { CircularProgress } from '../ui/CircularProgress';
import { MessageSquare, AlertCircle, CheckCircle, XCircle, PlayCircle, Clock, Edit, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { SmartGoal } from '../../types';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface SmartGoalCardProps {
  goal: SmartGoal;
  projectTitle: string;
  showEditButton?: boolean;
  onDelete?: (goalId: string) => void;
}

export const SmartGoalCard: React.FC<SmartGoalCardProps> = ({ goal, projectTitle, showEditButton = true, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
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
            
            {/* Goal timing status */}
            <div className="flex items-center mt-2 text-xs">
              {goal.achieved ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle size={12} className="mr-1" />
                  Completed on {new Date(goal.achieved_at || '').toLocaleDateString()}
                </span>
              ) : goal.started_early ? (
                <span className="flex items-center text-purple-600">
                  <PlayCircle size={12} className="mr-1" />
                  Started early (scheduled for {new Date(goal.start_date).toLocaleDateString()})
                </span>
              ) : new Date(goal.start_date) <= new Date() ? (
                <span className="flex items-center text-blue-600">
                  <Clock size={12} className="mr-1" />
                  In progress (started {new Date(goal.start_date).toLocaleDateString()})
                </span>
              ) : (
                <span className="flex items-center text-slate-600">
                  <Clock size={12} className="mr-1" />
                  Scheduled to start {new Date(goal.start_date).toLocaleDateString()}
                </span>
              )}
            </div>
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
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-slate-500">
            Last updated: {new Date(goal.updated_at).toLocaleDateString()}
          </div>
          {/* Action buttons for goals */}
          {showEditButton && (
            <div className="flex gap-2">
              {/* Delete button - only show for pending or completed goals */}
              {(goal.approval_status === 'pending' || goal.achieved) && (
                <>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 flex items-center">
                        <AlertTriangle size={12} className="mr-1" />
                        Confirm delete?
                      </span>
                      <Button
                        size="sm"
                        variant="danger"
                        className="text-white"
                        disabled={isDeleting}
                        onClick={async () => {
                          try {
                            setIsDeleting(true);
                            const { error } = await supabase
                              .from('smart_goals')
                              .delete()
                              .eq('id', goal.id);
                              
                            if (error) throw error;
                            
                            toast.success('Goal deleted successfully');
                            if (onDelete) onDelete(goal.id);
                          } catch (err) {
                            console.error('Error deleting goal:', err);
                            toast.error('Failed to delete goal');
                          } finally {
                            setIsDeleting(false);
                            setShowDeleteConfirm(false);
                          }
                        }}
                      >
                        Yes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  )}
                </>
              )}
              
              {/* Edit button - only for non-approved goals */}
              {goal.approval_status === 'approved' ? (
                <div className="text-xs text-slate-500 italic flex items-center">
                  <Lock size={12} className="mr-1" />
                  Approved goals cannot be edited
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-blue-600 hover:bg-blue-50 font-medium"
                  onClick={() => {
                    // Navigate to edit page with goal ID
                    if (goal.project_id) {
                      navigate(`/projects/${goal.project_id}/goals/edit?goalId=${goal.id}`);
                    } else {
                      navigate(`/goals/edit?goalId=${goal.id}`);
                    }
                  }}
                >
                  <Edit size={14} className="mr-1" />
                  {goal.approval_status === 'pending' ? 'Edit' : 'Edit'}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};