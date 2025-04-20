import React, { useState, useEffect } from 'react';
import { CalendarClock, Clock, Trophy } from 'lucide-react';
import { SmartGoalCard } from './SmartGoalCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import type { SmartGoal } from '../../types';

interface CategorizedGoalsListProps {
  goals: SmartGoal[];
  getProjectTitle: (projectId: string) => string;
}

export const CategorizedGoalsList: React.FC<CategorizedGoalsListProps> = ({ 
  goals,
  getProjectTitle
}) => {
  const [categorizedGoals, setCategorizedGoals] = useState<{
    todo: SmartGoal[];
    doing: SmartGoal[];
    done: SmartGoal[];
  }>({
    todo: [],
    doing: [],
    done: []
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

    setCategorizedGoals(grouped);
  }, [goals]);

  return (
    <Tabs defaultValue="todo" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="todo" className="flex items-center gap-2">
          <CalendarClock size={16} />
          <span>To Do ({categorizedGoals.todo.length})</span>
        </TabsTrigger>
        <TabsTrigger value="doing" className="flex items-center gap-2">
          <Clock size={16} />
          <span>Doing ({categorizedGoals.doing.length})</span>
        </TabsTrigger>
        <TabsTrigger value="done" className="flex items-center gap-2">
          <Trophy size={16} />
          <span>Done ({categorizedGoals.done.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="todo" className="space-y-4">
        {categorizedGoals.todo.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorizedGoals.todo.map((goal) => (
              <div
                key={goal.id}
                className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <SmartGoalCard 
                  goal={goal} 
                  projectTitle={getProjectTitle(goal.project_id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No upcoming goals scheduled.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="doing" className="space-y-4">
        {categorizedGoals.doing.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorizedGoals.doing.map((goal) => (
              <div
                key={goal.id}
                className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <SmartGoalCard 
                  goal={goal} 
                  projectTitle={getProjectTitle(goal.project_id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No goals currently in progress.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="done" className="space-y-4">
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
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
            <p>No goals have been completed yet.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
