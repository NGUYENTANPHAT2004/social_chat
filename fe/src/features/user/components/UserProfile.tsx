'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import { UserProfileProps } from '../type';
import { useFollowToggle, useIsFollowing } from '../hooks';
import { getUserDisplayName, getUserAvatarUrl, formatUserJoinDate, formatKCBalance } from '../utils';
import { FollowButton } from './FollowButton';

/**
 * UserProfile Component - Hiển thị profile chi tiết
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  isCurrentUser = false,
  onEdit,
  onFollow,
  onUnfollow,
}) => {
  const { isFollowing } = useIsFollowing(user.id);
  const { toggleFollow, isLoading: followLoading } = useFollowToggle();
  
const handleFollowClick = useCallback(() => {
  if (isFollowing) {
    if (onUnfollow) {
      onUnfollow();
    } else {
      toggleFollow(user.id, true);
    }
  } else {
    if (onFollow) {
      onFollow();
    } else {
      toggleFollow(user.id, false);
    }
  }
}, [isFollowing, onFollow, onUnfollow, toggleFollow, user.id]);


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Cover & Avatar */}
      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        <div className="absolute -bottom-16 left-6">
          <Image
            src={getUserAvatarUrl(user)}
            alt={getUserDisplayName(user)}
            width={128}
            height={128}
            className="rounded-full border-4 border-white object-cover"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-20 pb-6 px-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getUserDisplayName(user)}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Joined {formatUserJoinDate(user.createdAt)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {isCurrentUser ? (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Edit Profile
              </button>
            ) : (
              <FollowButton
                userId={user.id}
                isFollowing={isFollowing}
                onFollow={handleFollowClick}
                onUnfollow={handleFollowClick}
                isLoading={followLoading}
              />
            )}
          </div>
        </div>

        {/* Bio */}
        {user.profile.bio && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">{user.profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex space-x-6 text-sm">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {user.following.length}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">Following</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {user.followers.length}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">Followers</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatKCBalance(user.kcBalance)}
            </span>
          </div>
        </div>

        {/* Additional Info */}
        {user.profile.location && (
          <div className="mt-4 flex items-center text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {user.profile.location}
          </div>
        )}
      </div>
    </div>
  );
};