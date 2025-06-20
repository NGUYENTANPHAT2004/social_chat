'use client';

import React from 'react';
import { FollowingPage } from '@/features/user/pages';
import { useUserByUsername } from '@/features/user/hooks';

interface FollowingPageProps {
  params: {
    username: string;
  };
}

export default function UserFollowing({ params }: FollowingPageProps) {
  const { data: user } = useUserByUsername(params.username);
  
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">User not found</p>
        </div>
      </div>
    );
  }
  
  return <FollowingPage userId={user.id} />;
}