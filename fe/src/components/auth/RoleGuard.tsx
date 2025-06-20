'use client';

import React from 'react';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/features/user/type';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    return fallback || (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You dont have permission to access this content.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

