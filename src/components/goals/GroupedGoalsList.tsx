import React, { useState, useEffect } from 'react';
import { SmartGoal } from '../../types';
import { TeacherGoalReview } from './TeacherGoalReview';
import { SmartGoalCard } from './SmartGoalCard';
import { CalendarClock, Clock, Trophy, PlayCircle, PauseCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ColoredTabs, ColoredTabsList, ColoredTabsTrigger, ColoredTabsContent } from './ColoredTabs';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface GroupedGoalsListProps {
  goals: SmartGoal[];
  projectTitle: string;
  onGoalUpdated: () => void;
}

export const GroupedGoalsList: React.FC<GroupedGoalsListProps> = ({
  goals,
  projectTitle,
  onGoalUpdated
}) => {
  const { user } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  
  // Check if the current user is a teacher
  useEffect(() => {
    const checkIfTeacher = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
        setIsTeacher(!!data);
      } catch (err) {
        console.error('Error checking teacher status:', err);
      }
    };
    
    checkIfTeacher();
  }, [user]);
  const [groupedGoals, setGroupedGoals] = useState<{
    done: SmartGoal[];
    doing: SmartGoal[];
    todo: SmartGoal[];
  }>({
    done: [],
    doing: [],
    todo: []
  });
  
  // Track manually started/postponed goals locally until database column is added
  const [manuallyStartedGoals, setManuallyStartedGoals] = useState<string[]>([]);
  const [manuallyPostponedGoals, setManuallyPostponedGoals] = useState<string[]>([]);

  // Function to handle starting a goal early
  const handleStartEarly = async (goalId: string) => {
    try {
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
      
      // Update the local state to move the goal from todo to doing
      setGroupedGoals(prev => {
        const goalToMove = prev.todo.find(g => g.id === goalId);
        if (!goalToMove) return prev;
        
        return {
          todo: prev.todo.filter(g => g.id !== goalId),
          doing: [...prev.doing, goalToMove],
          done: prev.done
        };
      });
    } catch (err) {
      console.error('Error starting goal early:', err);
    }
  };
  
  // Function to handle postponing a goal (moving from Doing back to To Do)
  const handlePostpone = async (goalId: string) => {
    try {
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
      
      // Update the local state to move the goal from doing to todo
      setGroupedGoals(prev => {
        const goalToMove = prev.doing.find(g => g.id === goalId);
        if (!goalToMove) return prev;
        
        // Only allow postponing if the goal was started early or hasn't reached its start date
        const now = new Date();
        const startDate = new Date(goalToMove.start_date);
        if (goalToMove.started_early || startDate > now) {
          return {
            todo: [...prev.todo, goalToMove],
            doing: prev.doing.filter(g => g.id !== goalId),
            done: prev.done
          };
        }
        
        return prev;
      });
    } catch (err) {
      console.error('Error postponing goal:', err);
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

    setGroupedGoals(grouped);
  }, [goals]);

  return (
    <ColoredTabs defaultValue="todo" className="w-full">
      <ColoredTabsList className="mb-6">
        <ColoredTabsTrigger value="todo" color="red" className="flex items-center gap-2">
          <CalendarClock size={16} />
          <span>To Do ({groupedGoals.todo.length})</span>
        </ColoredTabsTrigger>
        <ColoredTabsTrigger value="doing" color="yellow" className="flex items-center gap-2">
          <Clock size={16} />
          <span>Doing ({groupedGoals.doing.length})</span>
        </ColoredTabsTrigger>
        <ColoredTabsTrigger value="done" color="green" className="flex items-center gap-2">
          <Trophy size={16} />
          <span>Done ({groupedGoals.done.length})</span>
        </ColoredTabsTrigger>
      </ColoredTabsList>

      <ColoredTabsContent value="todo" color="red" className="space-y-4">
        {groupedGoals.todo.length > 0 ? (
          groupedGoals.todo.map((goal) => (
            <div key={goal.id} className="relative">
              {isTeacher ? (
                <TeacherGoalReview
                  goal={goal}
                  projectTitle={projectTitle}
                  onGoalUpdated={onGoalUpdated}
                />
              ) : (
                <SmartGoalCard
                  goal={goal}
                  projectTitle={projectTitle}
                />
              )}
              {/* Start Early button */}
              <div className="absolute top-16 right-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartEarly(goal.id)}
                  className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 border-red-200"
                >
                  <PlayCircle size={16} />
                  Start Early
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No upcoming goals scheduled.</p>
          </div>
        )}
      </ColoredTabsContent>

      <ColoredTabsContent value="doing" color="yellow" className="space-y-4">
        {groupedGoals.doing.length > 0 ? (
          groupedGoals.doing.map((goal) => (
            <div key={goal.id} className="relative">
              {isTeacher ? (
                <TeacherGoalReview
                  goal={goal}
                  projectTitle={projectTitle}
                  onGoalUpdated={onGoalUpdated}
                />
              ) : (
                <SmartGoalCard
                  goal={goal}
                  projectTitle={projectTitle}
                />
              )}
              {/* Postpone button - only show for goals that were started early or haven't reached their start date */}
              {(goal.started_early || manuallyStartedGoals.includes(goal.id) || new Date(goal.start_date) > new Date()) && (
                <div className="absolute top-16 right-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePostpone(goal.id)}
                    className="flex items-center gap-1 bg-white hover:bg-yellow-50 text-yellow-600 border-yellow-200"
                  >
                    <PauseCircle size={16} />
                    Postpone
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No goals currently in progress.</p>
          </div>
        )}
      </ColoredTabsContent>

      <ColoredTabsContent value="done" color="green" className="space-y-4">
        {groupedGoals.done.length > 0 ? (
          groupedGoals.done.map((goal) => (
            isTeacher ? (
              <TeacherGoalReview
                key={goal.id}
                goal={goal}
                projectTitle={projectTitle}
                onGoalUpdated={onGoalUpdated}
              />
            ) : (
              <div key={goal.id} className="relative">
                <SmartGoalCard
                  goal={goal}
                  projectTitle={projectTitle}
                />
              </div>
            )
          ))
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No goals have been completed yet.</p>
          </div>
        )}
      </ColoredTabsContent>
    </ColoredTabs>
  );
};
