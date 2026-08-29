import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';
import { LoadingOverlay } from '@/components/feedback/LoadingOverlay';

interface AuthGuardProps {
  children: ReactNode;
  requiredPermission?: string;
}

export const AuthGuard = ({ children, requiredPermission }: AuthGuardProps) => {
  const { isAuthenticated, isSessionLocked, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingOverlay message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isSessionLocked) {
    return <Navigate to="/session-lock" replace />;
  }

  if (requiredPermission && user) {
    const hasPermission = user.permissions.includes(requiredPermission);
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
