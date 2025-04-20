import { useState, type FC, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expectedRole = searchParams.get('role') || '';
  const [authError, setAuthError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    }
  });

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setValue('rememberMe', true);
    }
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setAuthError(null);
      
      // First, try to sign in
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          setAuthError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setAuthError('An error occurred during login. Please try again later.');
        }
        return;
      }

      // Authentication successful
      console.log('Authentication successful:', authData);

      // Try to get the user's profile to check their role, but don't block login if it fails
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', data.email)
          .single();

        // Only check role if we successfully got the profile
        if (!profileError && profileData && expectedRole && profileData.role !== expectedRole) {
          setAuthError(`This account is registered as a ${profileData.role}. Please use the correct login option.`);
          // Sign out since the role doesn't match
          await supabase.auth.signOut();
          return;
        }
      } catch (profileError) {
        // Log the error but continue with login
        console.warn('Could not retrieve profile, but auth was successful:', profileError);
        
        // If the table doesn't exist, we might want to create it
        // This is optional and depends on your application's needs
        if (expectedRole) {
          console.log(`User logged in without profile verification. Expected role: ${expectedRole}`);
        }
      }

      // Save email for next time if "Remember me" is checked
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Navigate to the appropriate dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error logging in:', error);
      setAuthError('An unexpected error occurred. Please try again later.');
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
          Sign in to your account
          {expectedRole && (
            <span className="block text-lg font-medium text-slate-600 mt-2">
              as a {expectedRole}
            </span>
          )}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-0">
          <CardContent className="py-8 px-4 sm:px-10">
            {authError && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember_me"
                    type="checkbox"
                    {...register('rememberMe')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember_me" className="ml-2 block text-sm text-slate-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isSubmitting}
              >
                Sign in
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