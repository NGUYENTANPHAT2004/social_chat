import React from 'react';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import { User } from '@/types';

interface UserProfileProps {
  user: User;
  showStatus?: boolean;
  showBalance?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  showStatus = true,
  showBalance = false,
  size = 'md',
  onClick,
}) => {
  const sizeClasses = {
    sm: { avatar: 'sm' as const, text: 'text-sm', subtext: 'text-xs' },
    md: { avatar: 'md' as const, text: 'text-base', subtext: 'text-sm' },
    lg: { avatar: 'lg' as const, text: 'text-lg', subtext: 'text-base' },
  };

  const classes = sizeClasses[size];

  return (
    <div 
      className={`flex items-center space-x-3 ${onClick ? 'cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors' : ''}`}
      onClick={onClick}
    >
      <Avatar
        src={user.avatar}
        name={user.username}
        online={user.isOnline}
        size={classes.avatar}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className={`font-medium text-gray-900 truncate ${classes.text}`}>
            {user.username}
          </h3>
          {showStatus && (
            <Badge
              variant={user.isOnline ? 'success' : 'default'}
              size="sm"
            >
              {user.isOnline ? 'Online' : 'Offline'}
            </Badge>
          )}
        </div>
        {showBalance && (
          <p className={`text-gray-500 ${classes.subtext}`}>
            {user.kcBalance} KC
          </p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;