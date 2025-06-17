import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Gift, Trophy, AlertCircle } from 'lucide-react';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';

interface Notification {
  id: string;
  type: 'system' | 'gift' | 'game' | 'social';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  data?: any;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onMarkAsRead,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'gift':
        return <Gift className="w-5 h-5 text-pink-500" />;
      case 'game':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'social':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getVariant = () => {
    switch (notification.type) {
      case 'gift': return 'primary' as const;
      case 'game': return 'warning' as const;
      case 'social': return 'secondary' as const;
      default: return 'default' as const;
    }
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={() => {
        onClick(notification);
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            {getIcon()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2">
              <Badge variant={getVariant()} size="sm">
                {notification.type}
              </Badge>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {notification.message}
          </p>
          
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;