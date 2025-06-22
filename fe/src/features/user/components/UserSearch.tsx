'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User, UserSearchProps } from '../type';
import { useUserSearch } from '../hooks';

// Constants for search
const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

// Simple debounce function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Helper functions
const getUserDisplayName = (user: User): string => {
  return user.profile?.displayName || user.username || 'Unknown User';
};

const getUserAvatarUrl = (user: User): string => {
  if (user.avatar && user.avatar.trim() !== '') {
    // If avatar starts with http, use as-is, otherwise assume it's a relative path
    if (user.avatar.startsWith('http')) {
      return user.avatar;
    }
    return `${process.env.NEXT_PUBLIC_API_URL || ''}${user.avatar}`;
  }
  
  // Fallback to default avatar
  return '/images/default-avatar.png';
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

  // Use the hook properly without overriding queryKey
  const { data: searchResults = [], isLoading, error } = useUserSearch(
    { q: query },
    {
      enabled: query.length >= SEARCH_MIN_LENGTH,
    }
  );

  console.log('UserSearch debug:', {
    query,
    searchResults,
    isLoading,
    error,
    showResults
  });

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setQuery(value), SEARCH_DEBOUNCE_MS),
    []
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
    setShowResults(value.length >= SEARCH_MIN_LENGTH);
  }, [debouncedSearch]);

  const handleUserSelect = useCallback((user: User) => {
    setShowResults(false);
    onUserSelect?.(user);
  }, [onUserSelect]);

  const handleInputFocus = useCallback(() => {
    if (query.length >= SEARCH_MIN_LENGTH) {
      setShowResults(true);
    }
  }, [query.length]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => setShowResults(false), 200);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Searching...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              Search failed: {error.message || 'Unknown error'}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                >
                  <Image
                    src={getUserAvatarUrl(user)}
                    alt={getUserDisplayName(user)}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {getUserDisplayName(user)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      @{user.username}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No users found for `{query}`
            </div>
          )}
        </div>
      )}
    </div>
  );
};