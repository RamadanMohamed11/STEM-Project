import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface Group {
  id: string;
  name: string;
  code: string;
  created_at: string;
  member_count?: number;
}

export const GroupManager: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    try {
      if (!user) {
        setError('You must be logged in to view groups');
        setLoading(false);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('teacher_id', user.id);

      if (groupsError) throw groupsError;
      
      // Get member counts in a separate query if needed
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count, error: countError } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
            
          return {
            ...group,
            member_count: countError ? 0 : count || 0
          };
        })
      );
      
      setGroups(groupsWithCounts);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    if (!user) {
      setError('You must be logged in as a teacher to create a group.');
      return;
    }
    try {
      // 1. Generate a unique code using the Supabase RPC
      const { data: codeData, error: codeError } = await supabase.rpc('generate_group_code');
      if (codeError) throw codeError;
      const code = codeData;
      // 2. Insert the group with name, code, and teacher_id
      const { data, error } = await supabase
        .from('groups')
        .insert([
          { name: newGroupName, code, teacher_id: user.id }
        ])
        .select()
        .single();
      if (error) throw error;
      setGroups([...groups, data]);
      setNewGroupName('');
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group');
    }
  };


  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (loading) return <div>Loading groups...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Groups</h2>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => navigate('/teacher/goals/review')}
        >
          Review Student Goals
        </Button>
      </div>
      
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Input
            label="New Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter group name"
          />
        </div>
        <Button onClick={createGroup} disabled={!newGroupName.trim()}>
          <Plus size={16} className="mr-2" />
          Create Group
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card 
            key={group.id} 
            className="cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => navigate(`/groups/${group.id}`)}
          >
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-slate-100 rounded">{group.code}</code>
                  <button
                    onClick={() => copyCode(group.code)}
                    className="p-1 hover:text-blue-600"
                    title="Copy code"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Users size={16} />
                  <span>{group.member_count || 0}</span>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                Created {new Date(group.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
