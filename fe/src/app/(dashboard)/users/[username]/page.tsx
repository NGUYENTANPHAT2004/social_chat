'use client';

import React from 'react';
import { UserProfilePage } from '@/features/user/pages';

interface UserProfilePageProps {
  params: {
    username: string;
  };
}

export default function UserProfile({ params }: UserProfilePageProps) {
  return <UserProfilePage username={params.username} />;
}