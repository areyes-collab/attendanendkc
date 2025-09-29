'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Bell, Check, CheckCheck, X, Info, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Trash2 } from 'lucide-react';
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
  const { notifications } = useRealtimeNotifications(userId, userRole);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (notifications.length > 0) {
      setIsLoading(false);
    }
  }, [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      showToast.success('Marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showToast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId, userRole);
      showToast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setDeletingIds(prev => new Set(prev).add(notificationId));
    try {
      await deleteNotification(notificationId);
      showToast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showToast.error('Failed to delete notification');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClasses = "h-5 w-5";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClasses} text-success-600`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClasses} text-warning-600`} />;
      case 'error':
        return <XCircle className={`${iconClasses} text-destructive-600`} />;
      default:
        return <Info className={`${iconClasses} text-accent-600`} />;
    }
  };

  const getNotificationBadge = (category: string) => {
    const variants = {
      attendance: 'success',
      schedule: 'info',
      system: 'outline',
      profile: 'secondary',
    } as const;

    return (
      <Badge variant={variants[category as keyof typeof variants] || 'outline'} size="sm">
        {category}
      </Badge>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-end pt-20 pr-6 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-[420px] max-h-[80vh] overflow-hidden shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gray-700" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" size="sm" className="animate-pulse">
                      {unreadCount}
                    </Badge>
                  )}
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleMarkAllAsRead}
                      className="text-xs hover:bg-gray-200"
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={onClose}
                    className="hover:bg-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="bg-white rounded-xl p-4 border border-gray-100 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-600">{unreadCount}</div>
                    <div className="text-xs text-gray-500 font-medium">Unread</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{notifications.length - unreadCount}</div>
                    <div className="text-xs text-gray-500 font-medium">Read</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600 font-medium">Progress</span>
                    <span className="text-xs font-semibold text-accent-600">
                      {Math.round((notifications.length - unreadCount) / Math.max(notifications.length, 1) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.round((notifications.length - unreadCount) / Math.max(notifications.length, 1) * 100)}%`
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8">
                    <LoadingSpinner size="md" text="Loading notifications..." />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={Bell}
                      title="No notifications yet"
                      description="You'll see important updates and alerts here when they arrive."
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    <AnimatePresence>
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 hover:bg-gray-50 transition-all duration-200 ${
                            !notification.read ? 'bg-accent-50/50 border-l-4 border-l-accent-500' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-accent-500 rounded-full ml-2 mt-1 animate-pulse" />
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
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
                                
                                <div className="flex items-center gap-1">
                                  {!notification.read && (
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="text-accent-600 hover:text-accent-700 hover:bg-accent-50"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    disabled={deletingIds.has(notification.id)}
                                    className="text-gray-400 hover:text-destructive-600 hover:bg-destructive-50"
                                  >
                                    {deletingIds.has(notification.id) ? (
                                      <div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}