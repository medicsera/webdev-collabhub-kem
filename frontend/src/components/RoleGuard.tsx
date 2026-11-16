import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Role } from '../types';

interface RoleGuardProps {
  allowedRoles: Role[];
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { currentRole } = useApp();

  if (!allowedRoles.includes(currentRole)) {
    // Умный редирект на целевой главный экран в зависимости от фактической роли
    const fallbackPath = currentRole === 'student' ? '/catalog' : '/hr/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
