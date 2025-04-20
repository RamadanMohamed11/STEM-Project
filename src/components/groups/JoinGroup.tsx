import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface JoinGroupProps {
  onGroupJoined?: () => void;
}

export const JoinGroup: React.FC<JoinGroupProps> = ({ onGroupJoined }) => {
  const { user } = useAuth();
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const joinGroup = async () => {
    if (!groupCode.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Make sure user is logged in
    if (!user) {
      setError('You must be logged in to join a group.');
      setLoading(false);
      return;
    }
    
    // Log the code and user info for debugging
    console.log('Searching for group with code:', groupCode.trim().toUpperCase());
    console.log('Current user:', user);
    
    // Check user's role
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      console.log('User profile:', profile);
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }
    } catch (err) {
      console.error('Error checking user role:', err);
    }

    try {
      // First, find the group by code - using ilike for case-insensitive matching
      const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('id, name, code')
        .ilike('code', groupCode.trim().toUpperCase());
      
      // Log the results for debugging
      console.log('Search results:', { groups, groupError });
      
      if (groupError) {
        console.error('Error finding group:', groupError);
        setError('Error finding group. Please try again.');
        return;
      }
      
      if (!groups || groups.length === 0) {
        // Try a more direct approach with exact matching
        const { data: exactGroups, error: exactError } = await supabase
          .from('groups')
          .select('id, name, code');
          
        console.log('All groups:', exactGroups);
        
        // Try to find a match manually
        const matchingGroup = exactGroups?.find(g => 
          g.code.toUpperCase() === groupCode.trim().toUpperCase());
          
        if (matchingGroup) {
          console.log('Found matching group manually:', matchingGroup);
          const group = matchingGroup;
          
          // Continue with this group...
          // Make sure we have a user
          if (!user) {
            setError('You must be logged in to join a group.');
            return;
          }

          // Then, try to join the group
          const { error: joinError } = await supabase
            .from('group_members')
            .insert([{ 
              group_id: group.id,
              student_id: user.id 
            }]);

          if (joinError) {
            if (joinError.code === '23505') { // Unique violation
              setError('You are already a member of this group.');
            } else {
              throw joinError;
            }
            return;
          }

          setSuccess(`Successfully joined ${group.name}!`);
          setGroupCode('');
          
          // Trigger refresh of groups list if callback provided
          if (onGroupJoined) {
            onGroupJoined();
          }
          return;
        }
        
        setError('Invalid group code. Please check and try again.');
        return;
      }
      
      const group = groups[0];

      // Make sure we have a user
      if (!user) {
        setError('You must be logged in to join a group.');
        return;
      }

      // Then, try to join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert([{ 
          group_id: group.id,
          student_id: user.id 
        }]);

      if (joinError) {
        if (joinError.code === '23505') { // Unique violation
          setError('You are already a member of this group.');
        } else {
          throw joinError;
        }
        return;
      }

      setSuccess(`Successfully joined ${group.name}!`);
      setGroupCode('');
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Join a Group</h2>
      
      <div className="space-y-4">
        <Input
          label="Group Code"
          value={groupCode}
          onChange={(e) => setGroupCode(e.target.value)}
          placeholder="Enter group code"
          maxLength={8}
        />

        <Button
          onClick={joinGroup}
          disabled={!groupCode.trim() || loading}
          isLoading={loading}
          fullWidth
        >
          Join Group
        </Button>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded bg-green-50 border border-green-200">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
};
