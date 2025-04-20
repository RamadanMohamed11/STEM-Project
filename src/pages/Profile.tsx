import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { User, Mail, Key, Camera } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  updated_at?: string;
}

export const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError);
          
          // If the profile doesn't exist, create one
          if (fetchError.code === 'PGRST116' || fetchError.message.includes('no rows')) {
            console.log('Profile not found, creating one...');
            
            // Create a profile for the user
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                email: user.email,
                role: user.user_metadata?.role || 'student',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('*')
              .single();
              
            if (createError) {
              console.error('Error creating profile:', createError);
              setError('Failed to create profile');
            } else {
              console.log('Profile created successfully:', newProfile);
              setProfile(newProfile);
              setName(newProfile.name || '');
            }
          } else {
            setError('Failed to load profile');
          }
        } else {
          setProfile(data);
          setName(data.name || '');
          // Set avatar preview if exists
          if (data.avatar) {
            setAvatarPreview(data.avatar);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${user!.id}-${Date.now()}.${fileExt}`;

    try {
      // Delete old avatar if it exists
      if (profile?.avatar) {
        const oldAvatarPath = profile.avatar.split('/').pop();
        if (oldAvatarPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldAvatarPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      setSaving(true);
      setError(null);

      // Upload avatar if changed
      let avatarUrl = profile.avatar;
      if (avatar) {
        try {
          avatarUrl = await uploadAvatar(avatar);
        } catch (err: any) {
          setError(err?.message || 'Failed to upload avatar. Please try again.');
          setSaving(false);
          return;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name,
          avatar: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          name,
          avatar: avatarUrl
        };
      });

      // Update auth context user metadata
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });

      if (userUpdateError) {
        console.error('Error updating user metadata:', userUpdateError);
      }

      setError('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-slate-800">Your Profile</h1>
          <p className="text-slate-600">Manage your account settings and preferences</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                {(avatarPreview || profile?.avatar) ? (
                  <img
                    src={avatarPreview || profile?.avatar || ''}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <User size={32} className="text-blue-600" />
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-slate-50"
                >
                  <Camera size={16} className="text-slate-600" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-800">Profile Picture</h3>
                <p className="text-sm text-slate-600">
                  Upload a new avatar or keep your current one
                </p>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Role Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Role
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  value={profile?.role === 'student' ? 'Student' : profile?.role === 'teacher' ? 'Teacher' : profile?.role || ''}
                  readOnly
                  className="block w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-500"
                />
              </div>
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-500"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            {/* Password Change Link */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center"
                  onClick={() => navigate('/change-password')}
                >
                  <Key size={16} className="mr-2" />
                  Change Password
                </Button>
              </div>
            </div>

            {/* Error/Success Message */}
            {error && (
              <div className={`p-3 rounded-md ${
                error.includes('success') 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
