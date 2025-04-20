import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Goals } from './pages/Goals';
import { ProjectCreator } from './pages/ProjectCreator';
import { SmartGoalCreator } from './components/smart-goals/SmartGoalCreator';
import { Landing } from './pages/Landing';
import { AuthProvider } from './context/AuthContext';
import { ChangePassword } from './pages/ChangePassword';
import { GroupDetail } from './pages/GroupDetail';
import { GroupResources } from './pages/GroupResources';
import { ProjectDetail } from './pages/ProjectDetail';
import { TeacherGoalReviewPage } from './pages/TeacherGoalReviewPage';
import { TeacherGoalsReview } from './pages/TeacherGoalsReview';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<ProjectCreator />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/goals/new" element={<SmartGoalCreator />} />
            <Route path="/projects/:projectId/goals/new" element={<SmartGoalCreator />} />
            <Route path="/groups/:id" element={<GroupDetail />} />
            <Route path="/groups/:id/resources" element={<GroupResources />} />
            <Route path="/teacher/goals/review" element={<TeacherGoalReviewPage />} />
            <Route path="/teacher/goals" element={<TeacherGoalsReview />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;