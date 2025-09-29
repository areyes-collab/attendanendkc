'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, X, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification 
} from '@/lib/notifications';
import { useRealtimeNotifications } from '@/lib/notification-hooks';
import { showToast } from '@/components/ui/toast';

interface NotificationCenterProps {
  userId: string;
  userRole: 'admin' | 'teacher';
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ userId, userRole, isOpen, onClose }: NotificationCenterProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { notifications, unreadCount: realTimeUnreadCount } = useRealtimeNotifications(userId, userRole);

  useEffect(() => {
    if (notifications.length > 0) {
      setIsLoading(false);
    }
  }, [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const markAsReadPromise = markNotificationAsRead(notificationId);
      // Set button to loading state here if needed
      await markAsReadPromise;
      showToast.success('Marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showToast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const markAllPromise = markAllNotificationsAsRead(userId, userRole);
      // Set loading state here if needed
      await markAllPromise;
      showToast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const deletePromise = deleteNotification(notificationId);
      // Set loading state here if needed
      await deletePromise;
      showToast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showToast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-secondary" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-accent" />;
    }
  };

  const getNotificationBadge = (category: string) => {
    const variants = {
      attendance: 'default',
      schedule: 'secondary',
      system: 'outline',
      profile: 'success',
    } as const;

    return (
      <Badge variant={variants[category as keyof typeof variants] || 'default'}>
        {category}
      </Badge>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end pt-16 pr-6 z-50">
      <Card className="w-[400px] max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Notification Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 border border-blue-100 flex flex-col items-center">
                <span className="text-2xl font-semibold text-blue-600">{unreadCount}</span>
                <span className="text-sm text-blue-500 mt-1">Unread</span>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 flex flex-col items-center">
                <span className="text-2xl font-semibold text-gray-600">{notifications.length - unreadCount}</span>
                <span className="text-sm text-gray-500 mt-1">Read</span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 font-medium">Read Progress</span>
                <span className="text-sm font-medium text-blue-600">
                  {Math.round((notifications.length - unreadCount) / Math.max(notifications.length, 1) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ 
                    width: `${Math.round((notifications.length - unreadCount) / Math.max(notifications.length, 1) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 h-6 w-6"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-1 h-6 w-6 hover:text-destructive"
                              title="Delete"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          {getNotificationBadge(notification.category)}
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}