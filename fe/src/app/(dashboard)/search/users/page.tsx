'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {UserList } from '@/features/user/components';
import { useUserSearch } from '@/features/user/hooks';
import { User } from '@/features/user/type';
import { USER_CONSTANTS } from '@/features/user';

export default function SearchUsers() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const { data: searchResults = [], isLoading } = useUserSearch(
    { q: query },
     {
        queryKey: ['userSearch', query],
        enabled: query.length >= USER_CONSTANTS.SEARCH_MIN_LENGTH,
      }
  );

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Search Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find and connect with other users
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for users..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {query.length >= 2 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Search Results
          </h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <UserList
              users={searchResults}
              showFollowButton={true}
              onUserClick={handleUserSelect}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No users found for `{query}`
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Selected Users ({selectedUsers.length})
          </h2>
          <div className="grid gap-4">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={user.avatar}
                    alt={user.profile.displayName || user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user.profile.displayName || user.username}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}