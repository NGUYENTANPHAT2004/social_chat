// src/components/molecules/UserCard/UserCard.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  MessageCircle, 
  UserPlus, 
  UserMinus, 
  MapPin, 
  Calendar,
  MoreVertical,
  Shield,
  Ban
} from 'lucide-react';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import { User as UserType } from '@/types/user';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useUser } from '@/hooks/useUserProfile';
import { USER_STATUS_OPTIONS, USER_ROLE_OPTIONS } from '@/constants/user';

interface UserCardProps {
  user: UserType;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  showStats?: boolean;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  variant = 'default',
  showActions = true,
  showStats = true,
  onFollow,
  onUnfollow,
  onMessage,
  onViewProfile,
}) => {
  const { user: currentUser } = useAuth();
  const { followUser, unfollowUser, loading } = useUser();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnProfile = currentUser?.id === user.id;
  const canModerate = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  const getStatusBadge = (status: string) => {
    const statusOption = USER_STATUS_OPTIONS.find(option => option.value === status);
    if (!statusOption) return null;

    return (
      <Badge 
        variant={statusOption.color === 'green' ? 'success' : 
                statusOption.color === 'red' ? 'danger' : 'default'} 
        size="sm"
      >
        {statusOption.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleOption = USER_ROLE_OPTIONS.find(option => option.value === role);
    if (!roleOption || role === 'user') return null;

    return (
      <Badge 
        variant={roleOption.color === 'purple' ? 'primary' : 
                roleOption.color === 'yellow' ? 'warning' : 'secondary'} 
        size="sm"
      >
        <Shield className="w-3 h-3 mr-1" />
        {roleOption.label}
      </Badge>
    );
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(user.id);
        onUnfollow?.(user.id);
      } else {
        await followUser(user.id);
        onFollow?.(user.id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Follow/unfollow failed:', error);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(user.id);
    } else {
      router.push(`/users/${user.username}`);
    }
  };

  const handleMessage = () => {
    if (onMessage) {
      onMessage(user.id);
    } else {
      router.push(`/chat?user=${user.id}`);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <Avatar
          src={user.avatar}
          name={user.username}
          size="md"
          online={user.isOnline}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {user.profile?.displayName || user.username}
          </h3>
          <p className="text-sm text-gray-500 truncate">@{user.username}</p>
        </div>
        <div className="flex items-center space-x-1">
          {getRoleBadge(user.role)}
          {getStatusBadge(user.status)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar
              src={user.avatar}
              name={user.username}
              size="lg"
              online={user.isOnline}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.profile?.displayName || user.username}
              </h3>
              <p className="text-gray-500">@{user.username}</p>
              <div className="flex items-center space-x-2 mt-1">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={handleViewProfile}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </button>
                {!isOwnProfile && (
                  <button
                    onClick={handleMessage}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </button>
                )}
                {canModerate && !isOwnProfile && (
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-red-600"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    {user.status === 'banned' ? 'Unban' : 'Ban'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.profile?.bio && (
          <p className="text-gray-600 text-sm mt-3 line-clamp-2">
            {user.profile.bio}
          </p>
        )}

        {/* Location & Join Date */}
        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
          {user.profile?.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{user.profile.location}</span>
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && user.stats && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {user.stats.followersCount}
              </div>
              <div className="text-sm text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {user.stats.followingCount}
              </div>
              <div className="text-sm text-gray-500">Following</div>
            </div>
            {variant === 'detailed' && (
              <>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {user.kcBalance} KC
                  </div>
                  <div className="text-sm text-gray-500">Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {user.stats.gamesWon}
                  </div>
                  <div className="text-sm text-gray-500">Games Won</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && !isOwnProfile && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex space-x-3">
            <Button
              variant={isFollowing ? "outline" : "primary"}
              size="md"
              onClick={handleFollow}
              loading={loading}
              leftIcon={isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              className="flex-1"
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleMessage}
              leftIcon={<MessageCircle className="w-4 h-4" />}
              className="flex-1"
            >
              Message
            </Button>
          </div>
        </div>
      )}

      {/* Click overlay for compact cards */}
      {variant === 'compact' && (
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={handleViewProfile}
        />
      )}
    </div>
  );
};

export default UserCard;