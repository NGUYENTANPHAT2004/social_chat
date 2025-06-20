'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { UserCardProps } from '../types';
import { useFollowToggle, useIsFollowing } from '../hooks';
import { getUserDisplayName, getUserAvatarUrl, getUserStatusColor, formatKCBalance } from '../utils';
import { FollowButton } from './FollowButton';

/**
 * UserCard Component - Hiển thị thông tin cơ bản của user
 */
export const UserCard: React.FC<UserCardProps> = ({
  user,
  showFollowButton = false,
  onUserClick,
  onFollowClick,
  className,
}) => {
  const { toggleFollow, isLoading: followLoading } = useFollowToggle();
  const { isFollowing } = useIsFollowing(user.id);

  const handleUserClick = useCallback(() => {
    onUserClick?.(user);
  }, [onUserClick, user]);

  const handleFollowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFollowClick) {
      onFollowClick(user);
    } else {
      toggleFollow(user.id, isFollowing);
    }
  }, [onFollowClick, user, toggleFollow, isFollowing]);

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer',
        className
      )}
      onClick={handleUserClick}
    >
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="relative">
          <Image
            src={getUserAvatarUrl(user)}
            alt={getUserDisplayName(user)}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          <div
            className={cn(
              'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
              getUserStatusColor(user) === 'green' ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {getUserDisplayName(user)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            @{user.username}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {formatKCBalance(user.kcBalance)}
          </p>
        </div>

        {/* Follow Button */}
        {showFollowButton && (
          <FollowButton
            userId={user.id}
            isFollowing={isFollowing}
            onFollow={handleFollowClick}
            onUnfollow={handleFollowClick}
            isLoading={followLoading}
            className="ml-auto"
          />
        )}
      </div>

      {/* Bio */}
      {user.profile.bio && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {user.profile.bio}
        </p>
      )}
    </div>
  );
};