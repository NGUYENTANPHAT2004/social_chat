'use client';

import React from 'react';
import { UserListProps } from '../type';
import { UserCard } from './UserCard';
import { UserCardSkeleton } from './UserCardSkeleton';

/**
 * UserList Component - Hiển thị danh sách users
 */
export const UserList: React.FC<UserListProps> = ({
  users,
  isLoading = false,
  showFollowButton = false,
  onUserClick,
  onFollowClick,
  onLoadMore,
  hasMore = false,
}) => {
  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <UserCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          showFollowButton={showFollowButton}
          onUserClick={onUserClick}
          onFollowClick={onFollowClick}
        />
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};