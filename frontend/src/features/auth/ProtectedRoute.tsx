import {
    Navigate,
    Outlet,
} from 'react-router-dom';

import { useAuth } from './AuthProvider';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-rkmbg flex items-center justify-center text-slate-300">Validando sessão...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
