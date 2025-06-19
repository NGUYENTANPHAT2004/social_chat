// fe/src/components/molecules/UserCard/UserCard.tsx - Optimized
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  UserPlus, 
  UserMinus, 
  MapPin, 
  Calendar,
  MoreVertical,
  Shield,
  Ban,
  Eye
} from 'lucide-react';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import { User as UserType } from '@/types/user';
import { useUser } from '@/hooks/useUserProfile';
import { USER_STATUS_OPTIONS, USER_ROLE_OPTIONS } from '@/constants/user';

interface UserCardProps {
  user: UserType;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  showStats?: boolean;
  onClick?: () => void;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  onBan?: (userId: string) => void;
  onUnban?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  variant = 'default',
  showActions = true,
  showStats = true,
  onClick,
  onFollow,
  onUnfollow,
  onMessage,
  onViewProfile,
  onBan,
  onUnban,
}) => {
  const { 
    currentUser, 
    follow, 
    unfollow, 
    loading, 
    isCurrentUser, 
    isFollowing: checkIsFollowing 
  } = useUser();
  
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Initialize following state
  useEffect(() => {
    setIsFollowing(checkIsFollowing(user.id));
  }, [user.id, checkIsFollowing]);

  const isOwnProfile = isCurrentUser(user.id);
  const canModerate = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  const canInteract = !isOwnProfile && user.status !== 'banned';

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

  const handleFollow = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    try {
      if (isFollowing) {
        await unfollow(user.id);
        onUnfollow?.(user.id);
      } else {
        await follow(user.id);
        onFollow?.(user.id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Follow/unfollow failed:', error);
    }
  };

  const handleViewProfile = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (onViewProfile) {
      onViewProfile(user.id);
    } else {
      router.push(`/users/${user.username}`);
    }
  };

  const handleMessage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (onMessage) {
      onMessage(user.id);
    } else {
      router.push(`/chat?user=${user.id}`);
    }
  };

  const handleBan = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (user.status === 'banned') {
      onUnban?.(user.id);
    } else {
      onBan?.(user.id);
    }
    setShowMenu(false);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (variant === 'compact') {
      handleViewProfile();
    }
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <div 
        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
        onClick={handleCardClick}
      >
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
        
        {/* Quick action for compact */}
        {showActions && canInteract && (
          <Button
            variant={isFollowing ? "outline" : "primary"}
            size="sm"
            onClick={handleFollow}
            loading={loading}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>
    );
  }

  // Default and detailed variants
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="relative p-6 pb-4">
        {/* Close menu when clicking outside */}
        {showMenu && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
        )}
        
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
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                <button
                  onClick={handleViewProfile}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Profile
                </button>
                
                {canInteract && (
                  <button
                    onClick={handleMessage}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </button>
                )}
                
                {canModerate && !isOwnProfile && (user.role !== 'admin') && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleBan}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-red-600 transition-colors"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {user.status === 'banned' ? 'Unban User' : 'Ban User'}
                    </button>
                  </>
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
              <span className="truncate">{user.profile.location}</span>
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && user.stats && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {user.stats.followersCount || 0}
              </div>
              <div className="text-sm text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {user.stats.followingCount || 0}
              </div>
              <div className="text-sm text-gray-500">Following</div>
            </div>
            
            {variant === 'detailed' && (
              <>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {user.kcBalance || 0} KC
                  </div>
                  <div className="text-sm text-gray-500">Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {user.stats.gamesWon || 0}
                  </div>
                  <div className="text-sm text-gray-500">Games Won</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && canInteract && (
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
              {isFollowing ? 'Following' : 'Follow'}
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

      {/* Trust Score Indicator */}
      {variant === 'detailed' && user.trustScore !== undefined && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Trust Score</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    user.trustScore >= 80 ? 'bg-green-500' :
                    user.trustScore >= 60 ? 'bg-yellow-500' :
                    user.trustScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${user.trustScore}%` }}
                />
              </div>
              <span className="font-medium text-gray-900 min-w-[30px]">
                {user.trustScore}/100
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;