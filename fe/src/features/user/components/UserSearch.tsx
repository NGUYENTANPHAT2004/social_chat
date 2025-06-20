'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User, UserSearchProps } from '../type';
import { useUserSearch } from '../hooks';
import { getUserDisplayName, getUserAvatarUrl, debounce, USER_CONSTANTS } from '../utils';

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
  {
    queryKey: ['userSearch', query],
    enabled: query.length >= USER_CONSTANTS.SEARCH_MIN_LENGTH,
  }
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