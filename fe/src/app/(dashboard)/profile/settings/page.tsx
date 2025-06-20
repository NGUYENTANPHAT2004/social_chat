'use client';

import React from 'react';
import { UserSettingsPage } from '@/features/user/pages';
import { useAuth } from '@/features/auth';

export default function ProfileSettings() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Please log in to access settings</p>
        </div>
      </div>
    );
  }

  return <UserSettingsPage />;
}
