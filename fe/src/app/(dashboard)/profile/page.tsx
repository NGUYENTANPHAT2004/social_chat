'use client';

import React from 'react';
import { useAuth } from '@/features/auth';
import { UserProfilePage } from '@/features/user/pages';

export default function Profile() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return <UserProfilePage username={user.username} />;
}