import { ReactNode } from 'react';
import { useAuthStore } from '../state/auth.store';

interface PermissionGateProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

export const PermissionGate = ({ children, permission, fallback = null }: PermissionGateProps) => {
  const { user } = useAuthStore();

  if (!user || !user.permissions.includes(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
