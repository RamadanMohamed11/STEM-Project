import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { GroupManager } from '../components/groups/GroupManager';
import { JoinGroup } from '../components/groups/JoinGroup';
import { StudentGroupList } from '../components/groups/StudentGroupList';



export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Check user role
  useEffect(() => {
    if (!user) return;

    const checkRole = async () => {
      try {
        // First, check if the user has a profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error checking role:', profileError);
          
          // If the profile doesn't exist, create one
          if (profileError.code === 'PGRST116' || profileError.message.includes('no rows')) {
            console.log('Profile not found, creating one...');
            
            // Create a profile for the user
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                email: user.email,
                role: user.user_metadata?.role || 'student',
                created_at: new Date(),
                updated_at: new Date()
              })
              .select('role')
              .single();
              
            if (createError) {
              console.error('Error creating profile:', createError);
              setIsTeacher(false); // Default to student view
            } else {
              console.log('Profile created successfully:', newProfile);
              setIsTeacher(newProfile?.role === 'teacher');
            }
          } else if (profileError.code === '42P01') { // PostgreSQL code for "relation does not exist"
            // Check if role is in user metadata
            const userRole = user.user_metadata?.role;
            if (userRole) {
              setIsTeacher(userRole === 'teacher');
            } else {
              // Default to student view if no role information is available
              setIsTeacher(false);
            }
          } else {
            // Default to student view for other errors
            setIsTeacher(false);
          }
        } else {
          // If we successfully got the profile, use that role
          setIsTeacher(profileData?.role === 'teacher');
        }
      } catch (error) {
        console.error('Error checking role:', error);
        // Default to student view if there's an error
        setIsTeacher(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Dashboard</h1>
      
      {loading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-slate-600">Loading...</p>
        </div>
      )}
      
      {/* Teacher Dashboard */}
      {!loading && isTeacher && (
        <div>
          <GroupManager />
        </div>
      )}
      
      {/* Student Dashboard */}
      {!loading && isTeacher === false && (
        <div>
          {/* Your Groups Section */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Groups</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const joinGroupSection = document.getElementById('join-group-section');
                  if (joinGroupSection) {
                    joinGroupSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Join New Group
              </Button>
            </div>
            
            <p className="text-slate-600 mb-6">
              Select a group to view or create projects and SMART goals within that group.
            </p>
            
            <StudentGroupList key={refreshTrigger} />
          </section>
          
          {/* Join New Group Section */}
          <section id="join-group-section" className="mt-12 p-6 bg-white rounded-lg border border-slate-200">
            <h2 className="text-xl font-semibold mb-4">Join a New Group</h2>
            <p className="text-slate-600 mb-4">Enter the group code provided by your teacher to join a new group.</p>
            <JoinGroup onGroupJoined={() => setRefreshTrigger(prev => prev + 1)} />
          </section>
        </div>
      )}
    </div>
  );
};