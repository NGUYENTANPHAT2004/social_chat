// src/components/features/user/FollowersModal/FollowersModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { X, Users, Search } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import UserCard from '@/components/molecules/UserCard/UserCard';
import { useUser } from '@/hooks/useUserProfile';
import { UserBasic } from '@/types/user';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  type: 'followers' | 'following';
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  username,
  type,
}) => {
  const { fetchFollowers, fetchFollowing, loading } = useUser();
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, type]);

  const loadUsers = async (resetPage = true) => {
    try {
      const currentPage = resetPage ? 1 : page;
      const response = type === 'followers' 
        ? await fetchFollowers(userId, currentPage, 20)
        : await fetchFollowing(userId, currentPage, 20);

      if (resetPage) {
        setUsers(response.followers || response.following);
        setPage(1);
      } else {
        setUsers(prev => [...prev, ...(response.followers || response.following)]);
      }

      setTotal(response.total);
      setHasMore((response.followers || response.following).length === 20);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadUsers(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.profile?.displayName && user.profile.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {type === 'followers' ? 'Followers' : 'Following'}
              </h2>
              <p className="text-sm text-gray-500">@{username}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>

        {/* Stats */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {total} {type === 'followers' ? 'followers' : 'following'}
          </p>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
          {loading && users.length === 0 ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {searchQuery ? 'No users found' : `No ${type} yet`}
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Try searching with different keywords'
                  : `${username} hasn't ${type === 'followers' ? 'gained any followers' : 'followed anyone'} yet.`
                }
              </p>
            </div>
          ) : (
            <div>
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user as any} 
                  variant="compact"
                  showActions={false}
                  showStats={false}
                />
              ))}

              {/* Load More Button */}
              {hasMore && !searchQuery && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={loadMore}
                    loading={loading}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;