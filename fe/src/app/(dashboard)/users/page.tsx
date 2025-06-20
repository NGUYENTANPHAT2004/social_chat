'use client';

import React from 'react';
import { UserListPage } from '@/features/user/pages';
import { useAuth } from '@/features/auth';
// import { UserRole } from '@/features/user/type';

export default function Users() {
  const { user, isAuthenticated } = useAuth();

  // Check if user has admin/moderator permissions
  if (!isAuthenticated || !user || !['admin', 'moderator'].includes(user.role)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You dont have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <UserListPage />;
}