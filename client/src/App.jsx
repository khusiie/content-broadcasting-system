import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthView from './views/AuthView';
import TeacherDashboard from './views/TeacherDashboard';
import PrincipalDashboard from './views/PrincipalDashboard';
import PublicDisplay from './views/PublicDisplay';

const ProtectedRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthView />} />
        
        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/principal" 
          element={
            <ProtectedRoute role="principal">
              <PrincipalDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/display/:teacherId" element={<PublicDisplay />} />
      </Routes>
    </Router>
  );
}

export default App;
