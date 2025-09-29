import { subscribeToCollection, subscribeToDocument } from './firebase';
import { where } from 'firebase/firestore';
import type { Notification, NotificationPreferences } from './notifications';
import { useEffect, useState } from 'react';

export const useRealtimeNotifications = (userId: string, userRole: 'admin' | 'teacher') => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to notifications collection with filters and ordering
    const unsubscribe = subscribeToCollection(
      'notifications',
      (notificationsData) => {
        const userNotifications = notificationsData
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter(n => !n.read).length);
      },
      [
        where('user_id', '==', userId),
        where('user_role', '==', userRole),
      ]
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [userId, userRole]);

  return { notifications, unreadCount };
};

// Hook for real-time notification preferences
export const useNotificationPreferences = (userId: string) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToDocument(
      'notification_preferences',
      userId,
      (preferencesData) => {
        setPreferences(preferencesData);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return preferences;
};