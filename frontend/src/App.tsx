import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { QuizEditor } from './pages/QuizEditor';
import { TeacherQuizResults } from './pages/TeacherQuizResults';
import { StudentDashboard } from './pages/StudentDashboard';
import { QuizTake } from './pages/QuizTake';
import { QuizResultPage } from './pages/QuizResult';

function RequireUnauth({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  if (!initialized) return null;
  if (user) {
    return <Navigate to={user.role === 'Teacher' ? '/teacher' : '/student'} replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { user, initialized } = useAuth();
  if (!initialized) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'Teacher' ? '/teacher' : '/student'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RequireUnauth><LoginPage /></RequireUnauth>} />
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={['Teacher']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="quizzes/new" element={<QuizEditor />} />
        <Route path="quizzes/:id" element={<QuizEditor />} />
        <Route path="quizzes/:id/results" element={<TeacherQuizResults />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['Student']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="quizzes/:id/take" element={<QuizTake />} />
        <Route path="quizzes/:id/result" element={<QuizResultPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
