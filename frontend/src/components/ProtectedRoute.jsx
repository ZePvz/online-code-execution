import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { ScreenSpinner } from './ScreenSpinner';
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if(loading){
    return <ScreenSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
