// src/features/user/components/index.tsx

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  User,
  UserCardProps,
  UserListProps,
  UserSearchProps,
  UserProfileProps,
  EditProfileProps,
  UserSettingsProps,
  FollowButtonProps,
  UpdateProfileDto,
  UpdateSettingsDto,
} from '../type';
import {
  useFollowToggle,
  useIsFollowing,
  useUserSearch,
  useUpdateProfile,
  useUpdateSettings,
} from '../hooks';
import {
  getUserDisplayName,
  getUserAvatarUrl,
  formatUserJoinDate,
  formatKCBalance,
  getUserStatusColor,
  debounce,
  USER_CONSTANTS,
} from '../utils';

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

/**
 * UserSearch Component - Tìm kiếm users
 */
export const UserSearch: React.FC<UserSearchProps> = ({
  onUserSelect,
  placeholder = "Search users...",
  className,
}) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { data: searchResults = [], isLoading } = useUserSearch(
    { q: query },
    { enabled: query.length >= USER_CONSTANTS.SEARCH_MIN_LENGTH }
  );

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setQuery(value), USER_CONSTANTS.SEARCH_DEBOUNCE_MS),
    []
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
    setShowResults(value.length >= USER_CONSTANTS.SEARCH_MIN_LENGTH);
  }, [debouncedSearch]);

  const handleUserSelect = useCallback((user: User) => {
    setShowResults(false);
    onUserSelect?.(user);
  }, [onUserSelect]);

  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        placeholder={placeholder}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                >
                  <Image
                    src={getUserAvatarUrl(user)}
                    alt={getUserDisplayName(user)}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {getUserDisplayName(user)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No users found</div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * FollowButton Component - Nút follow/unfollow
 */
export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing,
  onFollow,
  onUnfollow,
  isLoading = false,
  className,
}) => {
  const handleClick = useCallback(() => {
    if (isFollowing) {
      onUnfollow();
    } else {
      onFollow();
    }
  }, [isFollowing, onFollow, onUnfollow]);

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
      onUnfollow?.() || toggleFollow(user.id, true);
    } else {
      onFollow?.() || toggleFollow(user.id, false);
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

/**
 * EditProfile Component - Form chỉnh sửa profile
 */
export const EditProfile: React.FC<EditProfileProps> = ({
  user,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<UpdateProfileDto>({
    displayName: user.profile.displayName,
    bio: user.profile.bio,
    location: user.profile.location,
    birthdate: user.profile.birthdate?.toISOString().split('T')[0],
  });

  const handleInputChange = useCallback((field: keyof UpdateProfileDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  }, [formData, onSave]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={formData.displayName || ''}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Your display name"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bio
        </label>
        <textarea
          value={formData.bio || ''}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Tell us about yourself"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Location
        </label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => handleInputChange('location', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Your location"
        />
      </div>

      {/* Birthdate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Birth Date
        </label>
        <input
          type="date"
          value={formData.birthdate || ''}
          onChange={(e) => handleInputChange('birthdate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/**
 * UserCardSkeleton - Loading skeleton cho UserCard
 */
export const UserCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
};

// Export all components
export {
  UserCard,
  UserList,
  UserSearch,
  FollowButton,
  UserProfile,
  EditProfile,
  UserCardSkeleton,
};