'use client';
import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Settings } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import NotificationItem from '@/components/molecules/NotificationItem/NotificationItem';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { apiService } from '@/services/api';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'system' | 'gift' | 'game' | 'social' | 'payment';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface NotificationResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    // Listen for real-time notifications
    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiService.get<NotificationResponse>('/notifications');
      setNotifications(response.data.items || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle notification action based on type
    switch (notification.type) {
      case 'gift':
        // Navigate to gifts page
        break;
      case 'game':
        // Navigate to game
        break;
      case 'social':
        // Navigate to chat/room
        break;
      case 'payment':
        // Navigate to transactions
        break;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.patch('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiService.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await apiService.delete('/notifications/clear-all');
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' || !notif.read
  );

  const unreadCount = notifications.filter(notif => !notif.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full text-sm ${filter === 'unread' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            <div className="flex space-x-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} title="Mark all as read">
                  <Check className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllNotifications} title="Clear all">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
          {loading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' ? "You're all caught up!" : "You'll see notifications here when you have them."}
              </p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button variant="outline" size="sm" fullWidth leftIcon={<Settings className="w-4 h-4" />}>
            Notification Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;