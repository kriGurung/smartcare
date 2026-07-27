import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './ui/Spinner.jsx';

// Guards a route by authentication and (optionally) role. Redirects guests to
// login (remembering where they were headed) and wrong-role users to their home.
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'admin' ? '/admin' : user.role === 'caregiver' ? '/caregiver' : '/patient';
    return <Navigate to={home} replace />;
  }
  return children;
}
