import React, { useState, useEffect } from 'react';
import { SmartGoal } from '../../types';
import { TeacherGoalReview } from './TeacherGoalReview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { CalendarClock, Clock, Trophy } from 'lucide-react';

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
  const [groupedGoals, setGroupedGoals] = useState<{
    done: SmartGoal[];
    doing: SmartGoal[];
    todo: SmartGoal[];
  }>({
    done: [],
    doing: [],
    todo: []
  });

  useEffect(() => {
    // Group goals based on status and dates
    const now = new Date();
    
    const grouped = goals.reduce(
      (acc, goal) => {
        // Done: Goals that are marked as achieved
        if (goal.achieved) {
          acc.done.push(goal);
        } 
        // Doing: Goals with start_date in the past and not achieved
        else if (new Date(goal.start_date) <= now) {
          acc.doing.push(goal);
        } 
        // To Do: Goals with start_date in the future
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
    <Tabs defaultValue="todo" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="todo" className="flex items-center gap-2">
          <CalendarClock size={16} />
          <span>To Do ({groupedGoals.todo.length})</span>
        </TabsTrigger>
        <TabsTrigger value="doing" className="flex items-center gap-2">
          <Clock size={16} />
          <span>Doing ({groupedGoals.doing.length})</span>
        </TabsTrigger>
        <TabsTrigger value="done" className="flex items-center gap-2">
          <Trophy size={16} />
          <span>Done ({groupedGoals.done.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="todo" className="space-y-4">
        {groupedGoals.todo.length > 0 ? (
          groupedGoals.todo.map((goal) => (
            <TeacherGoalReview
              key={goal.id}
              goal={goal}
              projectTitle={projectTitle}
              onGoalUpdated={onGoalUpdated}
            />
          ))
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No upcoming goals scheduled.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="doing" className="space-y-4">
        {groupedGoals.doing.length > 0 ? (
          groupedGoals.doing.map((goal) => (
            <TeacherGoalReview
              key={goal.id}
              goal={goal}
              projectTitle={projectTitle}
              onGoalUpdated={onGoalUpdated}
            />
          ))
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No goals currently in progress.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="done" className="space-y-4">
        {groupedGoals.done.length > 0 ? (
          groupedGoals.done.map((goal) => (
            <TeacherGoalReview
              key={goal.id}
              goal={goal}
              projectTitle={projectTitle}
              onGoalUpdated={onGoalUpdated}
            />
          ))
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No goals have been completed yet.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
