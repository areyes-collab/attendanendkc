'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bell, Save } from 'lucide-react';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences,
  type NotificationPreferences 
} from '@/lib/notifications';
import { showToast } from '@/components/ui/toast';

interface NotificationPreferencesProps {
  userId: string;
}

export function NotificationPreferencesComponent({ userId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<Partial<NotificationPreferences>>({
    email_notifications: true,
    push_notifications: true,
    attendance_alerts: true,
    schedule_changes: true,
    system_updates: true,
    late_arrival_alerts: true,
    absence_alerts: true,
    weekly_reports: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const data = await getNotificationPreferences(userId);
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      showToast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const saveToast = showToast.loading('Saving preferences...');

    try {
      await updateNotificationPreferences(userId, preferences);
      showToast.dismiss(saveToast);
      showToast.success('Notification preferences updated');
    } catch (error) {
      showToast.dismiss(saveToast);
      showToast.error('Failed to save preferences');
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading preferences...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* General Notifications */}
        <div>
          <h3 className="text-lg font-medium mb-4">General Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <input
                type="checkbox"
                id="email_notifications"
                checked={preferences.email_notifications}
                onChange={() => handleToggle('email_notifications')}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push_notifications">Push Notifications</Label>
                <p className="text-sm text-gray-600">Receive browser push notifications</p>
              </div>
              <input
                type="checkbox"
                id="push_notifications"
                checked={preferences.push_notifications}
                onChange={() => handleToggle('push_notifications')}
                className="rounded border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Attendance Alerts */}
        <div>
          <h3 className="text-lg font-medium mb-4">Attendance Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="attendance_alerts">General Attendance Alerts</Label>
                <p className="text-sm text-gray-600">Get notified about attendance events</p>
              </div>
              <input
                type="checkbox"
                id="attendance_alerts"
                checked={preferences.attendance_alerts}
                onChange={() => handleToggle('attendance_alerts')}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="late_arrival_alerts">Late Arrival Alerts</Label>
                <p className="text-sm text-gray-600">Get notified when you arrive late</p>
              </div>
              <input
                type="checkbox"
                id="late_arrival_alerts"
                checked={preferences.late_arrival_alerts}
                onChange={() => handleToggle('late_arrival_alerts')}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="absence_alerts">Absence Alerts</Label>
                <p className="text-sm text-gray-600">Get notified about absences</p>
              </div>
              <input
                type="checkbox"
                id="absence_alerts"
                checked={preferences.absence_alerts}
                onChange={() => handleToggle('absence_alerts')}
                className="rounded border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* System Updates */}
        <div>
          <h3 className="text-lg font-medium mb-4">System & Schedule</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="schedule_changes">Schedule Changes</Label>
                <p className="text-sm text-gray-600">Get notified about schedule updates</p>
              </div>
              <input
                type="checkbox"
                id="schedule_changes"
                checked={preferences.schedule_changes}
                onChange={() => handleToggle('schedule_changes')}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system_updates">System Updates</Label>
                <p className="text-sm text-gray-600">Get notified about system maintenance and updates</p>
              </div>
              <input
                type="checkbox"
                id="system_updates"
                checked={preferences.system_updates}
                onChange={() => handleToggle('system_updates')}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly_reports">Weekly Reports</Label>
                <p className="text-sm text-gray-600">Receive weekly attendance summary reports</p>
              </div>
              <input
                type="checkbox"
                id="weekly_reports"
                checked={preferences.weekly_reports}
                onChange={() => handleToggle('weekly_reports')}
                className="rounded border-gray-300"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}