'use client';

import { useState, useEffect } from 'react';
import { getDocuments } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Users, Calendar, Settings, AlertTriangle } from 'lucide-react';
import { 
  NotificationService, 
  type SystemAnnouncementData,
  type ClassReminderData,
  type AttendanceIrregularityData
} from '@/lib/notification-service';
import { showToast } from '@/components/ui/toast';

interface NotificationManagerProps {
  onClose: () => void;
}

export function NotificationManager({ onClose }: NotificationManagerProps) {
  const [activeTab, setActiveTab] = useState<'announcement' | 'reminder' | 'correction'>('announcement');
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  
  const [announcementData, setAnnouncementData] = useState<SystemAnnouncementData>({
    title: '',
    message: '',
    type: 'general',
    targetRole: 'all',
    urgent: false,
  });

  const [reminderData, setReminderData] = useState<ClassReminderData>({
    teacherId: '',
    teacherName: '',
    className: '',
    classTime: '',
    location: '',
    minutesUntilClass: 15,
  });

  const [attendanceData, setAttendanceData] = useState<AttendanceIrregularityData>({
    teacherId: '',
    teacherName: '',
    className: '',
    classTime: '',
    status: 'late',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSendAnnouncement = async () => {
    if (!announcementData.title.trim() || !announcementData.message.trim()) {
      showToast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await NotificationService.sendSystemAnnouncement(announcementData);
      showToast.success('Announcement sent successfully!');
      
      // Reset form
      setAnnouncementData({
        title: '',
        message: '',
        type: 'general',
        targetRole: 'all',
        urgent: false,
      });
    } catch (error) {
      showToast.error('Failed to send announcement');
      console.error('Error sending announcement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadTeachersAndClasses = async () => {
      try {
        const [teacherDocs, classDocs] = await Promise.all([
          getDocuments('teachers'),
          getDocuments('classrooms')
        ]);
        
        setTeachers(teacherDocs.map(t => ({ id: t.id, name: t.name })));
        setClasses(classDocs.map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error('Error loading teachers and classes:', error);
      }
    };

    loadTeachersAndClasses();
  }, []);

  const handleSendManualReminder = async () => {
    if (!reminderData.teacherId || !reminderData.className || !reminderData.classTime || !reminderData.location) {
      showToast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await NotificationService.sendClassReminder(reminderData);
      showToast.success('Class reminder sent successfully!');
      // Reset form
      setReminderData({
        teacherId: '',
        teacherName: '',
        className: '',
        classTime: '',
        location: '',
        minutesUntilClass: 15,
      });
    } catch (error) {
      showToast.error('Failed to send reminder');
      console.error('Error sending reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminders = async () => {
    setIsLoading(true);
    try {
      await NotificationService.sendDailyReminders();
      showToast.success('All class reminders sent successfully!');
    } catch (error) {
      showToast.error('Failed to send reminders');
      console.error('Error sending reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAttendanceAlert = async () => {
    if (!attendanceData.teacherId || !attendanceData.className || !attendanceData.classTime || !attendanceData.status) {
      showToast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await NotificationService.sendAttendanceIrregularity(attendanceData);
      showToast.success('Attendance alert sent successfully!');
      // Reset form
      setAttendanceData({
        teacherId: '',
        teacherName: '',
        className: '',
        classTime: '',
        status: 'late',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      showToast.error('Failed to send attendance alert');
      console.error('Error sending attendance alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIrregularities = async () => {
    setIsLoading(true);
    try {
      await NotificationService.checkAttendanceIrregularities();
      showToast.success('Attendance irregularities checked and notifications sent!');
    } catch (error) {
      showToast.error('Failed to check attendance irregularities');
      console.error('Error checking irregularities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'announcement', label: 'System Announcement', icon: Bell },
    { id: 'reminder', label: 'Class Reminders', icon: Calendar },
    { id: 'correction', label: 'Attendance Alerts', icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Manager
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 flex-1"
                size="sm"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* System Announcement Tab */}
          {activeTab === 'announcement' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Announcement Title</Label>
                <Input
                  id="title"
                  value={announcementData.title}
                  onChange={(e) => setAnnouncementData({...announcementData, title: e.target.value})}
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  value={announcementData.message}
                  onChange={(e) => setAnnouncementData({...announcementData, message: e.target.value})}
                  placeholder="Enter your announcement message..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Announcement Type</Label>
                  <Select
                    value={announcementData.type}
                    onChange={(e) => setAnnouncementData({...announcementData, type: e.target.value as any})}
                  >
                    <option value="general">General</option>
                    <option value="schedule_change">Schedule Change</option>
                    <option value="holiday">Holiday Notice</option>
                    <option value="maintenance">System Maintenance</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target">Target Audience</Label>
                  <Select
                    value={announcementData.targetRole || 'all'}
                    onChange={(e) => setAnnouncementData({...announcementData, targetRole: e.target.value as any})}
                  >
                    <option value="all">Everyone</option>
                    <option value="teacher">Teachers Only</option>
                    <option value="admin">Admins Only</option>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={announcementData.urgent}
                  onChange={(e) => setAnnouncementData({...announcementData, urgent: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="urgent">Mark as urgent</Label>
                {announcementData.urgent && (
                  <Badge variant="warning">Urgent</Badge>
                )}
              </div>

              <Button 
                onClick={handleSendAnnouncement} 
                disabled={isLoading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Announcement'}
              </Button>
            </div>
          )}

          {/* Class Reminders Tab */}
          {activeTab === 'reminder' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Class Reminders</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Send reminders to teachers about their upcoming classes.
                </p>

                <div className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="teacherId">Teacher</Label>
                    <Select 
                      id="teacherId"
                      value={reminderData.teacherId}
                      onChange={(e) => {
                        const teacher = teachers.find(t => t.id === e.target.value);
                        setReminderData({
                          ...reminderData,
                          teacherId: e.target.value,
                          teacherName: teacher?.name || ''
                        });
                      }}
                    >
                      <option value="">Select a teacher</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="className">Class</Label>
                    <Select 
                      id="className"
                      value={reminderData.className}
                      onChange={(e) => setReminderData({
                        ...reminderData,
                        className: e.target.value
                      })}
                    >
                      <option value="">Select a class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.name}>{cls.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="classTime">Class Time</Label>
                    <Input
                      id="classTime"
                      type="time"
                      value={reminderData.classTime}
                      onChange={(e) => setReminderData({
                        ...reminderData,
                        classTime: e.target.value
                      })}
                      placeholder="Select time"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={reminderData.location}
                      onChange={(e) => setReminderData({
                        ...reminderData,
                        location: e.target.value
                      })}
                      placeholder="Enter classroom or location"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSendManualReminder} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Class Reminder'}
                </Button>

                <div className="mt-4">
                  <Button 
                    onClick={handleSendReminders} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {isLoading ? 'Sending...' : 'Send All Today\'s Reminders'}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Manual: Select teacher and class details to send a specific reminder</li>
                  <li>• Automatic: System sends reminders 30 and 15 minutes before class</li>
                  <li>• Only teachers with classes today will receive automatic reminders</li>
                  <li>• Includes classroom location and time information</li>
                </ul>
              </div>
            </div>
          )}

          {/* Attendance Alerts Tab */}
          {activeTab === 'correction' && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">Attendance Irregularities</h3>
                <p className="text-sm text-yellow-800 mb-4">
                  Report attendance irregularities and notify teachers.
                </p>

                <div className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="attendanceTeacherId">Teacher</Label>
                    <Select 
                      id="attendanceTeacherId"
                      value={attendanceData.teacherId}
                      onChange={(e) => {
                        const teacher = teachers.find(t => t.id === e.target.value);
                        setAttendanceData({
                          ...attendanceData,
                          teacherId: e.target.value,
                          teacherName: teacher?.name || ''
                        });
                      }}
                    >
                      <option value="">Select a teacher</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="attendanceClassName">Class</Label>
                    <Select 
                      id="attendanceClassName"
                      value={attendanceData.className}
                      onChange={(e) => setAttendanceData({
                        ...attendanceData,
                        className: e.target.value
                      })}
                    >
                      <option value="">Select a class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.name}>{cls.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="attendanceClassTime">Class Time</Label>
                    <Input
                      id="attendanceClassTime"
                      type="time"
                      value={attendanceData.classTime}
                      onChange={(e) => setAttendanceData({
                        ...attendanceData,
                        classTime: e.target.value
                      })}
                      placeholder="Select time"
                    />
                  </div>

                  <div>
                    <Label htmlFor="attendanceDate">Date</Label>
                    <Input
                      id="attendanceDate"
                      type="date"
                      value={attendanceData.date}
                      onChange={(e) => setAttendanceData({
                        ...attendanceData,
                        date: e.target.value
                      })}
                      placeholder="Select date"
                    />
                  </div>

                  <div>
                    <Label htmlFor="attendanceStatus">Status</Label>
                    <Select 
                      id="attendanceStatus"
                      value={attendanceData.status}
                      onChange={(e) => setAttendanceData({
                        ...attendanceData,
                        status: e.target.value as 'late' | 'absent' | 'early_leave'
                      })}
                    >
                      <option value="late">Late Arrival</option>
                      <option value="absent">Absent</option>
                      <option value="early_leave">Early Leave</option>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleSendAttendanceAlert} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Attendance Alert'}
                </Button>

                <div className="mt-4">
                  <Button 
                    onClick={handleCheckIrregularities} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {isLoading ? 'Checking...' : 'Check All Attendance Issues'}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">Notification Types:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Late Arrival:</strong> Notify when a teacher arrives late to class</li>
                  <li>• <strong>Absence:</strong> Report when a teacher is absent from class</li>
                  <li>• <strong>Early Leave:</strong> Record when a teacher leaves before class ends</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}