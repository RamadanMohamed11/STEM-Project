import React, { useState, useEffect } from 'react';
import { CalendarClock, Clock, Trophy, PlayCircle, PauseCircle } from 'lucide-react';
import { SmartGoalCard } from './SmartGoalCard';
import type { SmartGoal } from '../../types';
import { ColoredTabs, ColoredTabsList, ColoredTabsTrigger, ColoredTabsContent } from './ColoredTabs';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface CategorizedGoalsListProps {
  goals: SmartGoal[];
  getProjectTitle: (projectId: string) => string;
}

export const CategorizedGoalsList: React.FC<CategorizedGoalsListProps> = ({ 
  goals,
  getProjectTitle
}) => {
  // State to track if we're currently updating a goal
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  // Track manually started/postponed goals locally until database column is added
  const [manuallyStartedGoals, setManuallyStartedGoals] = useState<string[]>([]);
  const [manuallyPostponedGoals, setManuallyPostponedGoals] = useState<string[]>([]);
  const [categorizedGoals, setCategorizedGoals] = useState<{
    todo: SmartGoal[];
    doing: SmartGoal[];
    done: SmartGoal[];
  }>({
    todo: [],
    doing: [],
    done: []
  });

  // Function to handle starting a goal early
  const handleStartEarly = async (goalId: string) => {
    try {
      setUpdatingGoalId(goalId);
      
      // Try to update the goal in the database
      try {
        await supabase
          .from('smart_goals')
          .update({ 
            started_early: true,
            postponed: false, // Reset postponed status if it exists
            updated_at: new Date().toISOString()
          })
          .eq('id', goalId);
      } catch (dbError) {
        console.log('Database column may not exist yet, using local state instead');
      }
      
      // Add the goal to our local tracking of manually started goals
      // and remove from postponed if it was there
      setManuallyStartedGoals(prev => [...prev, goalId]);
      setManuallyPostponedGoals(prev => prev.filter(id => id !== goalId));
      
      // Update local state to reflect the change
      setCategorizedGoals(prev => {
        // Find the goal in the todo list
        const goalToMove = prev.todo.find(g => g.id === goalId);
        if (!goalToMove) return prev;
        
        // Remove from todo and add to doing
        return {
          todo: prev.todo.filter(g => g.id !== goalId),
          doing: [...prev.doing, goalToMove],
          done: prev.done
        };
      });
    } catch (err) {
      console.error('Error starting goal early:', err);
    } finally {
      setUpdatingGoalId(null);
    }
  };
  
  // Function to handle goal deletion
  const handleDeleteGoal = (goalId: string) => {
    // Update local state to remove the deleted goal
    setCategorizedGoals(prev => {
      return {
        todo: prev.todo.filter(g => g.id !== goalId),
        doing: prev.doing.filter(g => g.id !== goalId),
        done: prev.done.filter(g => g.id !== goalId)
      };
    });
    
    // Show success toast
    toast.success('Goal deleted successfully');
  };
  
  // Function to handle postponing a goal (moving from Doing back to To Do)
  const handlePostpone = async (goalId: string) => {
    try {
      setUpdatingGoalId(goalId);
      
      // Try to update the goal in the database
      try {
        await supabase
          .from('smart_goals')
          .update({ 
            started_early: false,
            postponed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', goalId);
      } catch (dbError) {
        console.log('Database column may not exist yet, using local state instead');
      }
      
      // Add the goal to our local tracking of manually postponed goals
      // and remove from started if it was there
      setManuallyPostponedGoals(prev => [...prev, goalId]);
      setManuallyStartedGoals(prev => prev.filter(id => id !== goalId));
      
      // Update local state to reflect the change
      setCategorizedGoals(prev => {
        // Find the goal in the doing list
        const goalToMove = prev.doing.find(g => g.id === goalId);
        if (!goalToMove) return prev;
        // Always allow postponing now
        return {
          todo: [...prev.todo, goalToMove],
          doing: prev.doing.filter(g => g.id !== goalId),
          done: prev.done
        };
      });
    } catch (err) {
      console.error('Error postponing goal:', err);
    } finally {
      setUpdatingGoalId(null);
    }
  };

  useEffect(() => {
    // Group goals based on status, dates, manually started and postponed goals
    const now = new Date();
    
    const grouped = goals.reduce(
      (acc, goal) => {
        // Done: Goals that are marked as achieved
        if (goal.achieved) {
          acc.done.push(goal);
        } 
        // Check if goal is manually postponed
        else if (goal.postponed || manuallyPostponedGoals.includes(goal.id)) {
          // If postponed, move to todo regardless of date
          acc.todo.push(goal);
        }
        // Doing: Goals with start_date in the past OR manually started early
        else if (
          new Date(goal.start_date) <= now || 
          goal.started_early || 
          manuallyStartedGoals.includes(goal.id)
        ) {
          acc.doing.push(goal);
        } 
        // To Do: Goals with start_date in the future and not started early
        else {
          acc.todo.push(goal);
        }
        return acc;
      },
      { todo: [] as SmartGoal[], doing: [] as SmartGoal[], done: [] as SmartGoal[] }
    );

    // Sort goals by relevant dates
    grouped.done.sort((a, b) => new Date(b.achieved_at || 0).getTime() - new Date(a.achieved_at || 0).getTime());
    grouped.doing.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    grouped.todo.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    setCategorizedGoals(grouped);
  }, [goals]);

  return (
    <ColoredTabs defaultValue="todo" className="w-full">
      <ColoredTabsList className="mb-6">
        <ColoredTabsTrigger value="todo" color="red" className="flex items-center gap-2">
          <CalendarClock size={16} />
          <span>To Do ({categorizedGoals.todo.length})</span>
        </ColoredTabsTrigger>
        <ColoredTabsTrigger value="doing" color="yellow" className="flex items-center gap-2">
          <Clock size={16} />
          <span>Doing ({categorizedGoals.doing.length})</span>
        </ColoredTabsTrigger>
        <ColoredTabsTrigger value="done" color="green" className="flex items-center gap-2">
          <Trophy size={16} />
          <span>Done ({categorizedGoals.done.length})</span>
        </ColoredTabsTrigger>
      </ColoredTabsList>

      <ColoredTabsContent value="todo" color="red" className="space-y-4">
        {categorizedGoals.todo.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorizedGoals.todo.map((goal) => (
              <div
                key={goal.id}
                className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative"
              >
                <SmartGoalCard 
                  goal={goal} 
                  projectTitle={getProjectTitle(goal.project_id)}
                  onDelete={handleDeleteGoal}
                />
                {/* Start Early button */}
                <div className="absolute top-16 right-4 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartEarly(goal.id)}
                    disabled={updatingGoalId === goal.id}
                    className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 border-red-200"
                  >
                    {updatingGoalId === goal.id ? (
                      <span className="animate-pulse">Starting...</span>
                    ) : (
                      <>
                        <PlayCircle size={16} />
                        Start Early
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No upcoming goals scheduled.</p>
          </div>
        )}
      </ColoredTabsContent>

      <ColoredTabsContent value="doing" color="yellow" className="space-y-4">
        {categorizedGoals.doing.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorizedGoals.doing.map((goal) => (
              <div
                key={goal.id}
                className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative"
              >
                <SmartGoalCard 
                  goal={goal} 
                  projectTitle={getProjectTitle(goal.project_id)}
                  onDelete={handleDeleteGoal}
                />
                {/* Postpone button - always show for any "doing" goal */}
                <div className="absolute top-16 right-4 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePostpone(goal.id)}
                    disabled={updatingGoalId === goal.id}
                    className="flex items-center gap-1 bg-white hover:bg-yellow-50 text-yellow-600 border-yellow-200"
                  >
                    {updatingGoalId === goal.id ? (
                      <span className="animate-pulse">Postponing...</span>
                    ) : (
                      <>
                        <PauseCircle size={16} />
                        Postpone
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No goals currently in progress.</p>
          </div>
        )}
      </ColoredTabsContent>

      <ColoredTabsContent value="done" color="green" className="space-y-4">
        {categorizedGoals.done.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorizedGoals.done.map((goal) => (
              <div
                key={goal.id}
                className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <SmartGoalCard 
                  goal={goal} 
                  projectTitle={getProjectTitle(goal.project_id)}
                  onDelete={handleDeleteGoal}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No goals have been completed yet.</p>
          </div>
        )}
      </ColoredTabsContent>
    </ColoredTabs>
  );
};
