import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Mail, Lock, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { supabase } from '../lib/supabase';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'teacher'], { required_error: 'Please select a role' }),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      // Sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
          },
        },
      });

      if (signUpError) {
        // Check for specific error types
        if (signUpError.message.includes('already registered')) {
          alert('This email is already registered. Please use a different email or try to sign in.');
          return;
        }
        throw signUpError;
      }

      // If auth signup was successful, try to create a profile
      // But don't block the signup process if this fails
      try {
        await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user?.id, // Use the auth user ID as the profile ID
              name: data.name,
              email: data.email,
              role: data.role,
            }
          ]);
      } catch (profileError) {
        // Log the error but continue with the signup process
        console.warn('Could not create profile, but auth user was created:', profileError);
      }

      // Redirect to login page with a success message
      alert('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (error) {
      console.error('Error signing up:', error);
      
      // Provide a more specific error message if possible
      if (error instanceof Error) {
        alert(`Error signing up: ${error.message}`);
      } else {
        alert('Error signing up. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center text-2xl font-bold mb-2">
          <span className="text-blue-600">SMART</span>
          <span className="text-purple-600">Cap</span>
        </Link>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-0">
          <CardContent className="py-8 px-4 sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <Input
                id="name"
                label="Full Name"
                {...register('name')}
                error={errors.name?.message}
                leftIcon={<User size={16} />}
                fullWidth
              />

              <Input
                id="email"
                type="email"
                label="Email address"
                {...register('email')}
                error={errors.email?.message}
                leftIcon={<Mail size={16} />}
                fullWidth
              />

              <Input
                id="password"
                type="password"
                label="Password"
                {...register('password')}
                error={errors.password?.message}
                leftIcon={<Lock size={16} />}
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  {...register('role')}
                  className={`w-full px-3 py-2 border ${
                    errors.role ? 'border-red-300' : 'border-slate-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                >
                  <option value="">Select a role</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isSubmitting}
              >
                Sign up
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 text-center">
        <Link to="/" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
          <ChevronLeft size={16} className="mr-1" />
          Back to home
        </Link>
      </div>
    </div>
  );
};