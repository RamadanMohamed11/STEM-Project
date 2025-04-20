import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, School, UserPlus, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export const Landing: React.FC = () => {
  const { user, signOut } = useAuth();
  
  // If user is logged in and viewing the landing page, sign them out
  useEffect(() => {
    if (user) {
      signOut().catch(error => {
        console.error('Error signing out:', error);
      });
    }
  }, [user, signOut]);
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center text-3xl font-bold mb-6">
          <span className="text-blue-600">SMART</span>
          <span className="text-purple-600">Cap</span>
        </div>
        
        <h2 className="text-center text-2xl font-extrabold text-slate-800 mb-8">
          Welcome to Your STEM Capstone Journey
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <Card className="border-0">
          <CardContent className="py-8 px-4 sm:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Student Login */}
              <Link 
                to="/login?role=student" 
                className="flex flex-col items-center p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <GraduationCap size={48} className="text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Student</h3>
                <p className="text-sm text-slate-600 text-center mb-4">
                  Track your capstone projects and goals
                </p>
                <Button variant="outline" fullWidth>
                  Login as Student
                </Button>
              </Link>

              {/* Teacher Login */}
              <Link 
                to="/login?role=teacher" 
                className="flex flex-col items-center p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <School size={48} className="text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Teacher</h3>
                <p className="text-sm text-slate-600 text-center mb-4">
                  Manage and guide student projects
                </p>
                <Button variant="outline" fullWidth>
                  Login as Teacher
                </Button>
              </Link>

              {/* Sign Up */}
              <Link 
                to="/signup" 
                className="flex flex-col items-center p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <UserPlus size={48} className="text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">New User?</h3>
                <p className="text-sm text-slate-600 text-center mb-4">
                  Create a new account to get started
                </p>
                <Button variant="primary" fullWidth>
                  Sign Up
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About Section */}
      <div className="mt-16 sm:mx-auto sm:w-full sm:max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 inline-flex items-center">
            <Info className="text-blue-600 mr-2" />
            About SMARTCap
          </h2>
          <div className="mt-2 h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6 sm:p-10">
            <div className="prose max-w-none mb-10">
              <p className="text-slate-700 text-lg leading-relaxed mb-6">
              SMART cap : STEM Capstone Planner is a Website developed by the Chemistry B team to help STEM school students improve time management during their capstone projects. The app uses the SMART goal-setting method to guide students in planning, organizing, and completing their projects more effectively. It offers tools for goal creation, progress tracking, collaboration, and performance reporting—making it easier for both students and teachers to stay on track and succeed.
              </p>
              <p className="text-slate-700 text-lg leading-relaxed">
                Whether you're a student working on your capstone project or a teacher guiding students, 
                SMARTCap offers an intuitive interface to make your STEM journey successful.
              </p>
            </div>

            <div className="mt-12">
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Meet Our Chemistry (B) Team</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { name: "Sohila Thrwat", role: "Team Member" },
                  { name: "Mariam Kamal", role: "Team Member" },
                  { name: "Manar Youssef", role: "Team Member" },
                  { name: "Marwa Salah", role: "Team Member" },
                  { name: "Nadia Mostafa", role: "Team Member" },
                  { name: "Mahmoud Alaa", role: "Team Member" }
                ].map((member, index) => (
                  <div key={index} className="bg-slate-50 p-4 rounded-lg text-center hover:shadow-md transition-shadow duration-200">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      {member.name.charAt(0)}
                    </div>
                    <h4 className="font-medium text-slate-800">{member.name}</h4>
                    <p className="text-sm text-slate-500">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} SMARTCap - Created with ❤️ by Chemistry (B) Team
          </div>
        </div>
      </div>
    </div>
  );
};
