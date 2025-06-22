'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '🏠',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: '👤',
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: '💬',
  },
  {
    name: 'Search Users',
    href: '/search/users',
    icon: '🔍',
  },
  {
    name: 'Settings',
    href: '/profile/settings',
    icon: '⚙️',
  },
];

const adminNavigationItems = [
  {
    name: 'User Management',
    href: '/users',
    icon: '👥',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <div className="bg-white dark:bg-gray-800 w-64 min-h-screen shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          App
        </h1>
      </div>

      <nav className="mt-6">
        <div className="px-3">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1',
                pathname === item.href
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="mt-8 mb-3">
                <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Administration
                </h3>
              </div>
              {adminNavigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1',
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </div>
      </nav>

      {/* User Profile in Sidebar */}
      {user && (
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700">
          <Link href="/profile" className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2">
            <img
              src={user.avatar}
              alt={user.profile?.displayName || user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.profile?.displayName || user.username}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                @{user.username}
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}