import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-pastel flex items-center justify-center">
        <div className="glass rounded-2xl px-8 py-6 shadow-glass text-pastel-blue-700">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-pastel-blue-500 border-t-transparent rounded-full" />
            <span className="font-medium">세션을 확인하는 중이에요…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
