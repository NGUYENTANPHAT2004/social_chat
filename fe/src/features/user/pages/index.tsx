// src/features/user/pages/index.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  
  useUserByUsername,
  useCurrentProfile,
  useUserList,
  useUserFollowers,
  useUserFollowing,
  useUpdateProfile,
  useUpdateSettings,
  useUpdateAvatar,
  useBanUser,
  useUnbanUser,
  useDeleteUser,
} from '../hooks';
import {
  UserProfile,
  UserList,
  
  EditProfile,
  
} from '../components';
import {
  User,
  UserStatus,
  UserRole,
  UpdateProfileDto,
  UpdateSettingsDto,
} from '../type';
import { getUserDisplayName, formatKCBalance } from '../utils';
import Image from 'next/image';

/**
 * UserProfilePage - Trang profile của user
 */
export const UserProfilePage: React.FC<{ username: string }> = ({ username }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: user, isLoading, error } = useUserByUsername(username);
  const { data: currentUser } = useCurrentProfile();
  
  const updateProfileMutation = useUpdateProfile();
  
  const isCurrentUser = currentUser?.username === username;

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSaveProfile = useCallback(async (data: UpdateProfileDto) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }, [updateProfileMutation]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <UserProfileSkeleton />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            User Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The user you re looking for doesnt exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {isEditing ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Edit Profile
          </h2>
          <EditProfile
            user={user}
            onSave={handleSaveProfile}
            onCancel={handleCancelEdit}
            isLoading={updateProfileMutation.isPending}
          />
        </div>
      ) : (
        <UserProfile
          user={user}
          isCurrentUser={isCurrentUser}
          onEdit={handleEdit}
        />
      )}

      {/* User Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="KC Balance"
          value={formatKCBalance(user.kcBalance)}
          icon="💎"
        />
        <StatsCard
          title="Following"
          value={user.following.length.toString()}
          icon="👥"
        />
        <StatsCard
          title="Followers"
          value={user.followers.length.toString()}
          icon="🔥"
        />
      </div>

      {/* User Posts/Activities would go here */}
      <div className="mt-6">
        <UserActivitiesSection userId={user.id} />
      </div>
    </div>
  );
};

/**
 * UserListPage - Trang danh sách users (Admin)
 */
export const UserListPage: React.FC = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: undefined as UserStatus | undefined,
    role: undefined as UserRole | undefined,
    search: '',
  });

  const { data: usersData, isLoading, refetch } = useUserList(filters);
  const banUserMutation = useBanUser();
  const unbanUserMutation = useUnbanUser();
  const deleteUserMutation = useDeleteUser();

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handleBanUser = useCallback(async (userId: string, reason?: string) => {
    if (confirm('Are you sure you want to ban this user?')) {
      try {
        await banUserMutation.mutateAsync({ id: userId, reason });
        refetch();
      } catch (error) {
        console.error('Failed to ban user:', error);
      }
    }
  }, [banUserMutation, refetch]);

  const handleUnbanUser = useCallback(async (userId: string) => {
    if (confirm('Are you sure you want to unban this user?')) {
      try {
        await unbanUserMutation.mutateAsync(userId);
        refetch();
      } catch (error) {
        console.error('Failed to unban user:', error);
      }
    }
  }, [unbanUserMutation, refetch]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUserMutation.mutateAsync(userId);
        refetch();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  }, [deleteUserMutation, refetch]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          User Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage all users in the system
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value={UserStatus.ACTIVE}>Active</option>
              <option value={UserStatus.INACTIVE}>Inactive</option>
              <option value={UserStatus.BANNED}>Banned</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value={UserRole.USER}>User</option>
              <option value={UserRole.MODERATOR}>Moderator</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>

          {/* Results per page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Per Page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <UserTableSkeleton />
        ) : usersData && usersData.data.length > 0 ? (
          <>
            <UserTable
              users={usersData.data}
              onBan={handleBanUser}
              onUnban={handleUnbanUser}
              onDelete={handleDeleteUser}
            />
            
            {/* Pagination */}
            <Pagination
              currentPage={usersData.page}
              totalPages={Math.ceil(usersData.total / usersData.limit)}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * FollowersPage - Trang danh sách followers
 */
export const FollowersPage: React.FC<{ userId: string }> = ({ userId }) => {
  const {
    data: followersData,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useUserFollowers(userId);

  const followers = followersData?.pages.flatMap(page => page.data) || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Followers
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {followersData?.pages[0]?.total || 0} followers
        </p>
      </div>

      <UserList
        users={followers}
        isLoading={isLoading}
        showFollowButton={true}
        onLoadMore={fetchNextPage}
        hasMore={hasNextPage}
      />
    </div>
  );
};

/**
 * FollowingPage - Trang danh sách following
 */
export const FollowingPage: React.FC<{ userId: string }> = ({ userId }) => {
  const {
    data: followingData,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useUserFollowing(userId);

  const following = followingData?.pages.flatMap(page => page.data) || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Following
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {followingData?.pages[0]?.total || 0} following
        </p>
      </div>

      <UserList
        users={following}
        isLoading={isLoading}
        showFollowButton={true}
        onLoadMore={fetchNextPage}
        hasMore={hasNextPage}
      />
    </div>
  );
};

/**
 * UserSettingsPage - Trang cài đặt user
 */
export const UserSettingsPage: React.FC = () => {
  const { data: currentUser, isLoading } = useCurrentProfile();
  const updateSettingsMutation = useUpdateSettings();
  const updateAvatarMutation = useUpdateAvatar();

  const handleSettingsUpdate = useCallback(async (settings: UpdateSettingsDto) => {
    try {
      await updateSettingsMutation.mutateAsync(settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  }, [updateSettingsMutation]);

  const handleAvatarUpdate = useCallback(async (file: File) => {
    try {
      await updateAvatarMutation.mutateAsync(file);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  }, [updateAvatarMutation]);

  if (isLoading || !currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <UserSettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Account Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <div className="space-y-8">
        {/* Avatar Section */}
        <AvatarSection
          user={currentUser}
          onAvatarUpdate={handleAvatarUpdate}
          isLoading={updateAvatarMutation.isPending}
        />

        {/* Settings Section */}
        <SettingsSection
          user={currentUser}
          onSettingsUpdate={handleSettingsUpdate}
          isLoading={updateSettingsMutation.isPending}
        />

        {/* Privacy Section */}
        <PrivacySection user={currentUser} />

        {/* Notification Section */}
        <NotificationSection user={currentUser} />
      </div>
    </div>
  );
};

// Helper Components

const StatsCard: React.FC<{ title: string; value: string; icon: string }> = ({
  title,
  value,
  icon,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
      {value}
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
  </div>
);

const UserActivitiesSection: React.FC<{ userId: string }> = ({}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
      Recent Activities
    </h3>
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      No recent activities
    </div>
  </div>
);

const UserTable: React.FC<{
  users: User[];
  onBan: (userId: string, reason?: string) => void;
  onUnban: (userId: string) => void;
  onDelete: (userId: string) => void;
}> = ({ users, onBan, onUnban, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            User
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Role
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            KC Balance
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((user) => (
          <UserTableRow
            key={user.id}
            user={user}
            onBan={onBan}
            onUnban={onUnban}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  </div>
);

const UserTableRow: React.FC<{
  user: User;
  onBan: (userId: string, reason?: string) => void;
  onUnban: (userId: string) => void;
  onDelete: (userId: string) => void;
}> = ({ user, onBan, onUnban, onDelete }) => (
  <tr>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <Image
  src={user.avatar}
  alt={getUserDisplayName(user)}
  width={40} // tương đương w-20 (tailwind = 5 * 16px)
  height={40} // tương đương h-20
  className="rounded-full object-cover"
/>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {getUserDisplayName(user)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            @{user.username}
          </div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`px-2 py-1 text-xs rounded-full ${
        user.status === UserStatus.ACTIVE
          ? 'bg-green-100 text-green-800'
          : user.status === UserStatus.BANNED
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {user.status}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
      {user.role}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
      {formatKCBalance(user.kcBalance)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
      {user.status === UserStatus.BANNED ? (
        <button
          onClick={() => onUnban(user.id)}
          className="text-green-600 hover:text-green-900"
        >
          Unban
        </button>
      ) : (
        <button
          onClick={() => onBan(user.id)}
          className="text-red-600 hover:text-red-900"
        >
          Ban
        </button>
      )}
      <button
        onClick={() => onDelete(user.id)}
        className="text-red-600 hover:text-red-900"
      >
        Delete
      </button>
    </td>
  </tr>
);

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => (
  <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
    <div className="flex items-center justify-between">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  </div>
);

// Skeleton Components
const UserProfileSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-gray-300 h-32 rounded-t-lg" />
    <div className="bg-white p-6">
      <div className="flex items-center space-x-4">
        <div className="w-32 h-32 bg-gray-300 rounded-full" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-300 rounded w-48" />
          <div className="h-4 bg-gray-300 rounded w-32" />
        </div>
      </div>
    </div>
  </div>
);

const UserTableSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-32" />
            <div className="h-3 bg-gray-300 rounded w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const UserSettingsSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-300 rounded w-64" />
    <div className="space-y-4">
      <div className="h-4 bg-gray-300 rounded w-full" />
      <div className="h-4 bg-gray-300 rounded w-3/4" />
      <div className="h-4 bg-gray-300 rounded w-1/2" />
    </div>
  </div>
);

// Additional Settings Components
const AvatarSection: React.FC<{
  user: User;
  onAvatarUpdate: (file: File) => void;
  isLoading: boolean;
}> = ({ user, onAvatarUpdate, isLoading }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Profile Picture
    </h3>
    <div className="flex items-center space-x-6">
    <Image
  src={user.avatar}
  alt={getUserDisplayName(user)}
  width={80} // tương đương w-20 (tailwind = 5 * 16px)
  height={80} // tương đương h-20
  className="rounded-full object-cover"
/>
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAvatarUpdate(file);
          }}
          className="hidden"
          id="avatar-upload"
        />
        <label
          htmlFor="avatar-upload"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer inline-block"
        >
          {isLoading ? 'Uploading...' : 'Change Avatar'}
        </label>
      </div>
    </div>
  </div>
);

const SettingsSection: React.FC<{
  user: User;
  onSettingsUpdate: (settings: UpdateSettingsDto) => void;
  isLoading: boolean;
}> = ({ user, onSettingsUpdate, isLoading }) => {
  const [settings, setSettings] = useState(user.settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSettingsUpdate(settings);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        General Settings
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

const PrivacySection: React.FC<{ user: User }> = ({ user }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Privacy Settings
    </h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profile Privacy
        </label>
        <select
          value={user.settings.privacy}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="public">Public</option>
          <option value="friends">Friends Only</option>
          <option value="private">Private</option>
        </select>
      </div>
    </div>
  </div>
);

const NotificationSection: React.FC<{ user: User }> = ({ user }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Notifications
    </h3>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Push Notifications
        </span>
        <input
          type="checkbox"
          checked={user.pushSettings.enabled}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Notifications
        </span>
        <input
          type="checkbox"
          checked={user.settings.notifications}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
    </div>
  </div>
);