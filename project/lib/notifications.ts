import { createDocument, getDocuments, updateDocument, deleteDocument } from './firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id: string;
  user_id: string;
  user_role: 'admin' | 'teacher';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'attendance' | 'schedule' | 'system' | 'profile';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  attendance_alerts: boolean;
  schedule_changes: boolean;
  system_updates: boolean;
  late_arrival_alerts: boolean;
  absence_alerts: boolean;
  weekly_reports: boolean;
  created_at: string;
  updated_at: string;
}

// Create a new notification
export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
  try {
    const notificationData = {
      ...notification,
      read: false,
    };
    
    const docId = await createDocument('notifications', notificationData);
    return docId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId: string, userRole: 'admin' | 'teacher', limit_count = 50) => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('user_role', '==', userRole),
      orderBy('created_at', 'desc'),
      limit(limit_count)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDocument('notifications', notificationId, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string, userRole: 'admin' | 'teacher') => {
  try {
    const notifications = await getUserNotifications(userId, userRole);
    const unreadNotifications = notifications.filter(n => !n.read);
    
    await Promise.all(
      unreadNotifications.map(notification =>
        updateDocument('notifications', notification.id, { read: true })
      )
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string) => {
  try {
    await deleteDocument('notifications', notificationId);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Get notification preferences for a user
export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
  try {
    const preferences = await getDocuments('notification_preferences', [
      where('user_id', '==', userId)
    ]);
    
    return preferences[0] || null;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (
  userId: string, 
  preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) => {
  try {
    const existingPreferences = await getNotificationPreferences(userId);
    
    if (existingPreferences) {
      await updateDocument('notification_preferences', existingPreferences.id, {
        ...preferences,
        updated_at: new Date().toISOString(),
      });
    } else {
      const defaultPreferences: Omit<NotificationPreferences, 'id' | 'created_at'> = {
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        attendance_alerts: true,
        schedule_changes: true,
        system_updates: true,
        late_arrival_alerts: true,
        absence_alerts: true,
        weekly_reports: true,
        updated_at: new Date().toISOString(),
      };
      
      await createDocument('notification_preferences', {
        ...defaultPreferences,
        ...preferences,
      });
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

// Notification templates
export const NotificationTemplates = {
  lateArrival: (teacherName: string, className: string, time: string) => ({
    title: 'Late Arrival Alert',
    message: `${teacherName} arrived late to ${className} at ${time}`,
    type: 'warning' as const,
    category: 'attendance' as const,
  }),
  
  absence: (teacherName: string, className: string) => ({
    title: 'Absence Alert',
    message: `${teacherName} is marked absent for ${className}`,
    type: 'error' as const,
    category: 'attendance' as const,
  }),
  
  scheduleChange: (className: string, newTime: string) => ({
    title: 'Schedule Updated',
    message: `Your class ${className} has been rescheduled to ${newTime}`,
    type: 'info' as const,
    category: 'schedule' as const,
  }),
  
  profileUpdated: () => ({
    title: 'Profile Updated',
    message: 'Your profile information has been successfully updated',
    type: 'success' as const,
    category: 'profile' as const,
  }),
  
  systemAnnouncement: (title: string, message: string, isUrgent = false) => ({
    title,
    message,
    type: isUrgent ? ('warning' as const) : ('info' as const),
    category: 'system' as const,
  }),
};

// Send notification to multiple users
export const sendBulkNotifications = async (
  userIds: string[],
  userRole: 'admin' | 'teacher',
  notificationTemplate: Omit<Notification, 'id' | 'created_at' | 'read' | 'user_id' | 'user_role'>
) => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      user_role: userRole,
      ...notificationTemplate,
    }));
    
    await Promise.all(
      notifications.map(notification => createNotification(notification))
    );
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};