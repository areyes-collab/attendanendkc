'use client';

import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { SidebarContext } from '../layout';
import { Settings, Save, Database, Clock, Bell, Shield } from 'lucide-react';
import { getSettings, saveSettings, backupDatabase, exportData, clearOldRecords, type SystemSettings } from '@/lib/settings-service';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    systemName: 'Teacher Attendance System',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12',
    defaultGracePeriod: 10,
    autoMarkAbsent: true,
    absentThreshold: 15,
    allowManualEntry: true,
    emailNotifications: true,
    lateArrivalNotification: true,
    absentNotification: true,
    weeklyReports: true,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requirePasswordChange: false,
    twoFactorAuth: false,
  });

  const { showToast } = useToast();

  useEffect(() => {
    // Load settings when component mounts
    const loadSettings = async () => {
      try {
        const savedSettings = await getSettings();
        setSettings(savedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        showToast('Failed to load settings', 'error');
      }
    };
    loadSettings();
  }, [showToast]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settings);
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);

  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title="System Settings"
          subtitle="Configure system preferences and behavior"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
              <div className="flex-1" />
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* System Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="systemName">System Name</Label>
                    <Input
                      id="systemName"
                      value={settings.systemName}
                      onChange={(e) => handleInputChange('systemName', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={settings.dateFormat}
                      onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timeFormat">Time Format</Label>
                    <Select
                      value={settings.timeFormat}
                      onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                    >
                      <option value="12">12 Hour (AM/PM)</option>
                      <option value="24">24 Hour</option>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Attendance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultGracePeriod">Default Grace Period (minutes)</Label>
                    <Input
                      id="defaultGracePeriod"
                      type="number"
                      min="0"
                      max="60"
                      value={settings.defaultGracePeriod}
                      onChange={(e) => handleInputChange('defaultGracePeriod', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="absentThreshold">Auto-mark Absent After (minutes)</Label>
                    <Input
                      id="absentThreshold"
                      type="number"
                      min="5"
                      max="120"
                      value={settings.absentThreshold}
                      onChange={(e) => handleInputChange('absentThreshold', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoMarkAbsent"
                      checked={settings.autoMarkAbsent}
                      onChange={(e) => handleInputChange('autoMarkAbsent', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="autoMarkAbsent">Automatically mark teachers as absent</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowManualEntry"
                      checked={settings.allowManualEntry}
                      onChange={(e) => handleInputChange('allowManualEntry', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="allowManualEntry">Allow manual attendance entry</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="emailNotifications">Enable email notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lateArrivalNotification"
                      checked={settings.lateArrivalNotification}
                      onChange={(e) => handleInputChange('lateArrivalNotification', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="lateArrivalNotification">Notify on late arrivals</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="absentNotification"
                      checked={settings.absentNotification}
                      onChange={(e) => handleInputChange('absentNotification', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="absentNotification">Notify on absences</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="weeklyReports"
                      checked={settings.weeklyReports}
                      onChange={(e) => handleInputChange('weeklyReports', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="weeklyReports">Send weekly attendance reports</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="480"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="32"
                      value={settings.passwordMinLength}
                      onChange={(e) => handleInputChange('passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requirePasswordChange"
                      checked={settings.requirePasswordChange}
                      onChange={(e) => handleInputChange('requirePasswordChange', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="requirePasswordChange">Require periodic password changes</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="twoFactorAuth"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="twoFactorAuth">Enable two-factor authentication</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        const url = await backupDatabase();
                        // Create a temporary link and trigger download
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        showToast('Database backup created successfully', 'success');
                      } catch (error) {
                        console.error('Backup failed:', error);
                        showToast('Failed to create database backup', 'error');
                      }
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        const blob = await exportData();
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `export-${new Date().toISOString().slice(0, 10)}.csv`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        showToast('Data exported successfully', 'success');
                      } catch (error) {
                        console.error('Export failed:', error);
                        showToast('Failed to export data', 'error');
                      }
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to clear old records? This action cannot be undone.')) {
                        try {
                          // Clear records older than 6 months
                          const cutoffDate = new Date();
                          cutoffDate.setMonth(cutoffDate.getMonth() - 6);
                          await clearOldRecords(cutoffDate);
                          showToast('Old records cleared successfully', 'success');
                        } catch (error) {
                          console.error('Clear records failed:', error);
                          showToast('Failed to clear old records', 'error');
                        }
                      }
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Clear Old Records
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Manage your database with backup, export, and cleanup operations. Backup creates a full JSON snapshot,
                  export creates a CSV file of key data, and clear removes records older than 6 months.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}