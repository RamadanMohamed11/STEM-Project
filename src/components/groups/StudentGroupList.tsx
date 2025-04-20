import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Copy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../ui/Card';

interface Group {
  id: string;
  name: string;
  code: string;
  created_at: string;
  member_count?: number;
}

export const StudentGroupList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    try {
      if (!user) {
        setError('You must be logged in to view groups');
        setLoading(false);
        return;
      }

      // Get the groups the student is a member of
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups:group_id(
            id,
            name,
            code,
            created_at
          )
        `)
        .eq('student_id', user.id);

      if (membershipError) throw membershipError;
      
      // Format the data to match the Group interface
      const formattedGroups = membershipData?.map(item => {
        // Ensure item.groups is properly typed
        const group = item.groups as unknown as Group;
        return {
          id: group.id,
          name: group.name,
          code: group.code,
          created_at: group.created_at,
          member_count: 0 // We'll update this later
        };
      }) || [];
      
      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        formattedGroups.map(async (group) => {
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
  }, [user]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  if (loading) {
    return <div className="text-center py-4">Loading your groups...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  return (
    <div>
      {groups.length > 0 ? (
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
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation when clicking copy button
                        copyCode(group.code);
                      }}
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
                  Joined {new Date(group.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
          <h3 className="text-lg font-medium text-slate-800 mb-4">You haven't joined any groups yet</h3>
          <p className="text-slate-600 mb-6">Join a group using a group code provided by your teacher.</p>
        </div>
      )}
    </div>
  );
};
