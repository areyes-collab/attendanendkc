'use client';

import { useState, useEffect, Suspense } from 'react';
import { Bell, Send, Calendar, AlertTriangle, Users, Settings, Info, CheckCircle2, Clock, Trash2, X } from 'lucide-react';
import { NotificationManager } from '@/components/admin/notification-manager';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDocuments, deleteDocument, deleteAllDocuments } from '@/lib/firebase';
import type { Notification } from '@/lib/notifications';
import { showToast } from '@/components/ui/toast';

function NotificationsContent() {
  const [showManager, setShowManager] = useState(false);
  const { user } = useUser();
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadNotifications = async () => {
      try {
        // Get all notifications from Firestore
        const notifications = await getDocuments('notifications');
        
        if (!mounted) return;

        if (Array.isArray(notifications)) {
          // Sort by created_at and take latest 10
          const sortedNotifications = notifications
            .filter(n => n.created_at) // Filter out notifications without created_at
            .sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return Number.isNaN(dateB) || Number.isNaN(dateA) ? 0 : dateB - dateA;
            })
            .slice(0, 10);

          setRecentNotifications(sortedNotifications as Notification[]);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [user]);

  const notificationTypes = [
    {
      icon: AlertTriangle,
      title: 'Attendance Irregularities',
      description: 'Automatically notify teachers about late arrivals, absences, or early departures',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      icon: Calendar,
      title: 'Class Reminders',
      description: 'Send reminders to teachers about their upcoming classes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: Settings,
      title: 'Attendance Corrections',
      description: 'Notify teachers when their attendance records are manually updated',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      icon: Bell,
      title: 'System Announcements',
      description: 'Broadcast important updates, schedule changes, and school notices',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
                <p className="text-gray-600">Manage and send notifications to teachers and staff</p>
              </div>
              <Button onClick={() => setShowManager(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </div>

            {/* Notification Types Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notificationTypes.map((type, index) => (
                <Card key={index} className={`${type.bgColor} ${type.borderColor} border`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`flex items-center gap-2 ${type.color}`}>
                      <type.icon className="h-5 w-5" />
                      {type.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-sm">{type.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setShowManager(true)}
                  >
                    <Bell className="h-6 w-6" />
                    <span>System Announcement</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setShowManager(true)}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>Send Reminders</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setShowManager(true)}
                  >
                    <AlertTriangle className="h-6 w-6" />
                    <span>Check Attendance</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Notification Activity</CardTitle>
                {recentNotifications.length > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        try {
                          await deleteAllDocuments('notifications');
                          setRecentNotifications([]);
                          showToast.success('All notifications cleared');
                        } catch (error) {
                          console.error('Error clearing notifications:', error);
                          showToast.error('Failed to clear notifications');
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center p-6">
                      <p className="text-gray-500">Loading notifications...</p>
                    </div>
                  ) : recentNotifications.length === 0 ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Bell className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">No Recent Activity</p>
                        <p className="text-sm text-gray-600">No notifications have been sent yet. Send your first notification to see the activity here.</p>
                      </div>
                    </div>
                  ) : (
                    recentNotifications.map((notification) => {
                      const getIcon = () => {
                        switch (notification.type) {
                          case 'info':
                            return <Info className="h-5 w-5 text-blue-600" />;
                          case 'success':
                            return <CheckCircle2 className="h-5 w-5 text-green-600" />;
                          case 'warning':
                            return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
                          case 'error':
                            return <AlertTriangle className="h-5 w-5 text-red-600" />;
                          default:
                            return <Bell className="h-5 w-5 text-purple-600" />;
                        }
                      };

                      return (
                        <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          {getIcon()}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-gray-600 truncate">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">
                                {notification.created_at ? new Date(notification.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'Unknown date'}
                              </p>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-xs text-gray-500 capitalize">{notification.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500" title="Unread notification" />
                            )}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await deleteDocument('notifications', notification.id);
                                  setRecentNotifications(prev => prev.filter(n => n.id !== notification.id));
                                  showToast.success('Notification deleted');
                                } catch (error) {
                                  console.error('Error deleting notification:', error);
                                  showToast.error('Failed to delete notification');
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                              title="Delete notification"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {showManager && (
        <NotificationManager onClose={() => setShowManager(false)} />
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    }>
      <NotificationsContent />
    </Suspense>
  );
}