import React, { useState, useEffect } from 'react';
import { Check, X, MessageSquare, Trophy, Trash2, AlertTriangle, Percent } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';
import { CircularProgress } from '../ui/CircularProgress';
import { Textarea } from '../ui/Textarea';
import { Slider } from '../ui/Slider';
import { supabase } from '../../lib/supabase';
import type { SmartGoal } from '../../types';

interface TeacherGoalReviewProps {
  goal: SmartGoal;
  projectTitle: string;
  onGoalUpdated: () => void;
}

export const TeacherGoalReview: React.FC<TeacherGoalReviewProps> = ({ 
  goal, 
  projectTitle,
  onGoalUpdated 
}) => {
  const [feedback, setFeedback] = useState(goal.teacher_feedback || '');
  const [progress, setProgress] = useState(goal.progress);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showProgressSlider, setShowProgressSlider] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Update local progress state when goal progress changes
  useEffect(() => {
    setProgress(goal.progress);
  }, [goal.progress]);
  
  // Auto-save progress after slider change stops
  useEffect(() => {
    // Only trigger if progress has changed and is different from goal.progress
    if (progress !== goal.progress && !isSubmitting) {
      const timer = setTimeout(() => {
        handleProgressUpdate(progress);
      }, 500); // Wait 500ms after last change before saving
      
      return () => clearTimeout(timer);
    }
  }, [progress]);

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('smart_goals')
        .update({ 
          approval_status: status,
          teacher_feedback: feedback || null,
          teacher_id: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', goal.id);

      if (updateError) throw updateError;
      
      // Call the callback to refresh the goals list
      onGoalUpdated();
      
      // Hide the feedback form after submission
      setShowFeedbackForm(false);
    } catch (err: any) {
      console.error('Error updating goal status:', err);
      setError(err.message || 'Failed to update goal status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAchieved = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('smart_goals')
        .update({ 
          achieved: true,
          achieved_at: now,
          progress: 100, // Set progress to 100% when achieved
          updated_at: now
        })
        .eq('id', goal.id);

      if (updateError) throw updateError;
      
      // Update local state
      setProgress(100);
      
      // Call the callback to refresh the goals list
      onGoalUpdated();
    } catch (err: any) {
      console.error('Error marking goal as achieved:', err);
      setError(err.message || 'Failed to mark goal as achieved');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleProgressUpdate = async (newProgress: number) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Ensure progress is an integer between 0 and 100
      const validProgress = Math.min(Math.max(Math.round(newProgress), 0), 100);
      
      // Update local state immediately for responsive UI
      setProgress(validProgress);
      
      const now = new Date().toISOString();
      const updates: any = { 
        progress: validProgress,
        updated_at: now
      };
      
      // If progress is 100%, automatically mark as achieved
      if (validProgress === 100 && !goal.achieved) {
        updates.achieved = true;
        updates.achieved_at = now;
      } else if (validProgress < 100 && goal.achieved) {
        // If progress is reduced below 100%, unmark as achieved
        updates.achieved = false;
        updates.achieved_at = null;
      }
      
      const { error: updateError } = await supabase
        .from('smart_goals')
        .update(updates)
        .eq('id', goal.id);

      if (updateError) throw updateError;
      
      // Call the callback to refresh the goals list
      onGoalUpdated();
    } catch (err: any) {
      console.error('Error updating goal progress:', err);
      setError(err.message || 'Failed to update goal progress');
      
      // Revert to previous progress value on error
      setProgress(goal.progress);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnmarkAchieved = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('smart_goals')
        .update({ 
          achieved: false,
          achieved_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', goal.id);

      if (updateError) throw updateError;
      
      // Call the callback to refresh the goals list
      onGoalUpdated();
    } catch (err: any) {
      console.error('Error unmarking goal as achieved:', err);
      setError(err.message || 'Failed to unmark goal as achieved');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('smart_goals')
        .delete()
        .eq('id', goal.id);

      if (deleteError) throw deleteError;
      
      // Call the callback to refresh the goals list
      onGoalUpdated();
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      setError(err.message || 'Failed to delete goal');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadge = () => {
    // Show achieved badge if the goal is marked as achieved
    if (goal.achieved) {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center">
          <Trophy size={12} className="mr-1" />
          Achieved
        </span>
      );
    }
    
    // Otherwise show approval status
    switch (goal.approval_status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Needs Revision</span>;
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending Review</span>;
    }
  };

  const handleProgressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setProgress(Math.min(Math.max(value, 0), 100));
    }
  };

  return (
    <Card className="h-full hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="relative cursor-pointer" 
              onClick={() => setShowProgressSlider(!showProgressSlider)} 
              title="Click to update progress"
            >
              <CircularProgress 
                progress={progress} 
                size={40} 
                showText={false} 
                color={goal.achieved ? "purple" : "blue"}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium">{progress}%</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium">{goal.title}</h4>
              <p className="text-sm text-slate-500">{projectTitle}</p>
            </div>
          </div>
          <div>
            {getStatusBadge()}
          </div>
        </div>
        
        {/* Progress bar and slider */}
        <div className="flex items-center gap-4">
          <CircularProgress progress={progress} size={60} strokeWidth={8} />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">Progress</span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleProgressInputChange}
                    className="w-16 h-8 px-2 text-right pr-7 border rounded text-sm"
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                    <Percent size={14} />
                  </span>
                </div>
                {progress === 100 && goal.achieved && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Trophy size={12} className="mr-1" /> Achieved
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Slider 
                value={progress} 
                min={0} 
                max={100} 
                step={1}
                onChange={(value: number) => setProgress(value)}
                disabled={isSubmitting}
                className="my-2"
                showValue={false}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
              {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              )}
            </div>
          </div>
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
          
          {goal.teacher_feedback && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-700 flex items-center gap-1">
                <MessageSquare size={16} />
                Teacher Feedback
              </h4>
              <p className="text-sm text-slate-700 mt-1">{goal.teacher_feedback}</p>
            </div>
          )}
          
          {showFeedbackForm && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Provide Feedback
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback or suggestions for this goal..."
                rows={3}
                className="w-full"
              />
            </div>
          )}
          
          {error && (
            <div className="p-2 bg-red-50 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col border-t pt-4 gap-3">
        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md mb-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="font-medium text-red-700">Delete this goal?</span>
            </div>
            <p className="text-sm text-red-600 mb-3">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteGoal}
                disabled={isSubmitting}
                leftIcon={<Trash2 size={14} />}
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Main action buttons */}
        <div className="flex justify-between w-full">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              leftIcon={<MessageSquare size={16} />}
              disabled={isSubmitting}
            >
              {showFeedbackForm ? 'Hide Feedback' : goal.teacher_feedback ? 'Edit Feedback' : 'Add Feedback'}
            </Button>
            
            {/* Delete button */}
            {!showDeleteConfirm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                leftIcon={<Trash2 size={16} />}
                disabled={isSubmitting}
                className="text-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Achievement toggle button */}
            <Button
              variant={goal.achieved ? "outline" : "primary"}
              size="sm"
              onClick={goal.achieved ? handleUnmarkAchieved : handleMarkAchieved}
              leftIcon={<Trophy size={16} />}
              disabled={isSubmitting}
              className={goal.achieved ? "text-purple-600 hover:bg-purple-50" : "bg-purple-600 hover:bg-purple-700"}
              title={goal.achieved ? "Goal is currently marked as achieved" : "Mark this goal as achieved"}
            >
              {goal.achieved ? 'Unmark Achieved' : 'Mark Achieved'}
            </Button>
            
            {/* Approval buttons - only show if not achieved */}
            {!goal.achieved && (
              goal.approval_status === 'pending' ? (
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleStatusUpdate('rejected')}
                    leftIcon={<X size={16} />}
                    disabled={isSubmitting}
                  >
                    Needs Revision
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleStatusUpdate('approved')}
                    leftIcon={<Check size={16} />}
                    disabled={isSubmitting}
                  >
                    Approve
                  </Button>
                </div>
              ) : (
                <Button
                  variant={goal.approval_status === 'approved' ? 'danger' : 'success'}
                  size="sm"
                  onClick={() => handleStatusUpdate(goal.approval_status === 'approved' ? 'rejected' : 'approved')}
                  leftIcon={goal.approval_status === 'approved' ? <X size={16} /> : <Check size={16} />}
                  disabled={isSubmitting}
                >
                  {goal.approval_status === 'approved' ? 'Mark for Revision' : 'Approve'}
                </Button>
              )
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
