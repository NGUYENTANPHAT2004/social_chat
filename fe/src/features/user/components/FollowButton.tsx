'use client';

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FollowButtonProps } from '../type';

/**
 * FollowButton Component - Nút follow/unfollow
 */
export const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  onFollow,
  onUnfollow,
  isLoading = false,
  className,
}) => {
  const handleClick = useCallback(
  (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isFollowing) {
      onUnfollow(e);
    } else {
      onFollow(e);
    }
  },
  [isFollowing, onFollow, onUnfollow]
);


  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-blue-500 text-white hover:bg-blue-600',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </span>
      ) : (
        <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
      )}
    </button>
  );
};