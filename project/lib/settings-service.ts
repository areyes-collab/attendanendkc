import { db, getDocuments, createDocument, updateDocument, deleteDocument } from './firebase';

export interface SystemSettings {
  // System Settings
  systemName: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  
  // Attendance Settings
  defaultGracePeriod: number;
  autoMarkAbsent: boolean;
  absentThreshold: number;
  allowManualEntry: boolean;
  
  // Notification Settings
  emailNotifications: boolean;
  lateArrivalNotification: boolean;
  absentNotification: boolean;
  weeklyReports: boolean;
  
  // Security Settings
  sessionTimeout: number;
  passwordMinLength: number;
  requirePasswordChange: boolean;
  twoFactorAuth: boolean;
}

const defaultSettings: SystemSettings = {
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
};

export const getSettings = async (): Promise<SystemSettings> => {
  try {
    const settings = await getDocuments('system_settings');
    return settings[0] || defaultSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: SystemSettings): Promise<void> => {
  try {
    const currentSettings = await getDocuments('system_settings');
    if (currentSettings.length > 0) {
      await updateDocument('system_settings', currentSettings[0].id, settings);
    } else {
      await createDocument('system_settings', settings);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
};

export const backupDatabase = async (): Promise<string> => {
  try {
    // Fetch all collections
    const collections = ['teachers', 'classrooms', 'schedules', 'attendance_logs', 'system_settings', 'notifications'];
    const backup: Record<string, any> = {};

    for (const collection of collections) {
      const documents = await getDocuments(collection);
      backup[collection] = documents;
    }

    // Create backup file name with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.json`;

    // Convert to blob and create download URL
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    return url;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create database backup');
  }
};

export const exportData = async (collections: string[] = ['teachers', 'classrooms', 'schedules']): Promise<Blob> => {
  try {
    const exportData: Record<string, any> = {};

    for (const collection of collections) {
      const documents = await getDocuments(collection);
      exportData[collection] = documents;
    }

    // Convert to CSV format
    let csv = '';
    for (const [collection, documents] of Object.entries(exportData)) {
      csv += `\n--- ${collection} ---\n`;
      if (documents.length > 0) {
        // Headers
        csv += Object.keys(documents[0]).join(',') + '\n';
        // Data
        documents.forEach((doc: any) => {
          csv += Object.values(doc).map(value => 
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          ).join(',') + '\n';
        });
      }
    }

    return new Blob([csv], { type: 'text/csv' });
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Failed to export data');
  }
};

export const clearOldRecords = async (beforeDate: Date, collections: string[] = ['attendance_logs', 'notifications']): Promise<void> => {
  try {
    const promises = collections.map(async (collection) => {
      const documents = await getDocuments(collection);
      const oldDocs = documents.filter((doc: any) => {
        const docDate = doc.created_at || doc.date || doc.timestamp;
        return new Date(docDate) < beforeDate;
      });
      
      // Delete old documents
      for (const doc of oldDocs) {
        // This is a placeholder - you'll need to implement deleteDocument in firebase.ts
        await deleteDocument(collection, doc.id);
      }
      
      return oldDocs.length;
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error clearing old records:', error);
    throw new Error('Failed to clear old records');
  }
};