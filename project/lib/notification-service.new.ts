import { createNotification, sendBulkNotifications, NotificationTemplates } from './notifications';
import { getDocuments } from './firebase';
import { where } from 'firebase/firestore';
import { formatTime } from './utils';

export interface AttendanceIrregularityData {
  teacherId: string;
  teacherName: string;
  className: string;
  classTime: string;
  status: 'late' | 'absent' | 'early_leave';
  date: string;
}

export interface ClassReminderData {
  teacherId: string;
  teacherName: string;
  className: string;
  classTime: string;
  location: string;
  minutesUntilClass: number;
}

export interface AttendanceCorrectionData {
  teacherId: string;
  teacherName: string;
  date: string;
  className: string;
  oldStatus: string;
  newStatus: string;
  correctedBy: string;
}

export interface SystemAnnouncementData {
  title: string;
  message: string;
  type: 'schedule_change' | 'holiday' | 'maintenance' | 'general';
  targetRole?: 'admin' | 'teacher' | 'all';
  urgent?: boolean;
}

export interface TeacherActionData {
  teacherId: string;
  teacherName: string;
  action: string;
  details: string;
  timestamp: string;
}

export class NotificationService {
  // Send notification for teacher actions to admin
  static async sendTeacherActionNotification(data: TeacherActionData) {
    try {
      // Get all admins
      const admins = await getDocuments('admins');
      
      if (admins.length === 0) {
        console.log('No admins found to notify');
        return;
      }

      const template = {
        title: `👨‍🏫 Teacher Action: ${data.action}`,
        message: `${data.teacherName} ${data.action} - ${data.details} at ${formatTime(data.timestamp)}`,
        type: 'info' as const,
        category: 'system' as const
      };

      // Send notification to all admins
      await sendBulkNotifications(
        admins.map(admin => admin.id),
        'admin',
        template
      );

      console.log(`Teacher action notification sent to admins for ${data.teacherName}'s ${data.action}`);
    } catch (error) {
      console.error('Error sending teacher action notification:', error);
    }
  }

  // Send class reminder notification
  static async sendClassReminder(data: ClassReminderData) {
    const timeText = data.minutesUntilClass <= 15 
      ? `in ${data.minutesUntilClass} minutes`
      : `at ${data.classTime}`;

    const notification = {
      user_id: data.teacherId,
      user_role: 'teacher' as const,
      title: 'Class Reminder',
      message: `Reminder: You are scheduled to teach ${timeText} in ${data.className} at ${data.location}.`,
      type: 'info' as const,
      category: 'schedule' as const,
    };

    try {
      await createNotification(notification);
      console.log(`Class reminder sent to ${data.teacherName}`);
    } catch (error) {
      console.error('Error sending class reminder:', error);
    }
  }

  // Send system announcement
  static async sendSystemAnnouncement(data: SystemAnnouncementData) {
    try {
      const typeConfig = {
        schedule_change: { icon: '📅', priority: 'high' },
        holiday: { icon: '🎉', priority: 'medium' },
        maintenance: { icon: '🔧', priority: 'high' },
        general: { icon: '📢', priority: 'medium' }
      };

      const config = typeConfig[data.type];
      const title = `${config.icon} ${data.title}`;

      // Create notification template
      const template = NotificationTemplates.systemAnnouncement(title, data.message, data.urgent);
      
      if (data.targetRole === 'all' || !data.targetRole) {
        const [teachers, admins] = await Promise.all([
          getDocuments('teachers'),
          getDocuments('admins')
        ]);
        
        // Send to teachers
        if (teachers.length > 0) {
          await sendBulkNotifications(
            teachers.map(t => t.id),
            'teacher',
            template
          );
        }

        // Send to admins
        if (admins.length > 0) {
          await sendBulkNotifications(
            admins.map(a => a.id),
            'admin',
            template
          );
        }
      } else {
        const collection = data.targetRole === 'admin' ? 'admins' : 'teachers';
        const users = await getDocuments(collection);
        
        if (users.length > 0) {
          await sendBulkNotifications(
            users.map(u => u.id),
            data.targetRole,
            template
          );
        }
      }

      console.log(`System announcement sent: ${data.title}`);
    } catch (error) {
      console.error('Error sending system announcement:', error);
    }
  }

  // Send daily class reminders
  static async sendDailyReminders() {
    try {
      const today = new Date().getDay();
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();

      // Get today's active schedules
      const schedules = await getDocuments('schedules', [
        where('day_of_week', '==', today),
        where('active', '==', true)
      ]);

      if (schedules.length === 0) {
        console.log('No active schedules found for today');
        return;
      }

      // Get all teachers and classrooms
      const [allTeachers, allClassrooms] = await Promise.all([
        getDocuments('teachers'),
        getDocuments('classrooms')
      ]);

      // Create lookup maps
      const teacherMap = new Map(allTeachers.map(t => [t.id, t]));
      const classroomMap = new Map(allClassrooms.map(c => [c.id, c]));

      let remindersSent = 0;
      for (const schedule of schedules) {
        const teacher = teacherMap.get(schedule.teacher_id);
        const classroom = classroomMap.get(schedule.classroom_id);

        if (!teacher || !classroom) continue;

        // Parse schedule time
        const [scheduleHour, scheduleMinute] = schedule.start_time.split(':').map(Number);
        const scheduleTime = new Date();
        scheduleTime.setHours(scheduleHour, scheduleMinute, 0, 0);

        // Calculate minutes until class
        const minutesUntilClass = Math.floor((scheduleTime.getTime() - currentTime.getTime()) / (1000 * 60));

        // Send reminders at appropriate times
        if (minutesUntilClass === 30 || minutesUntilClass === 15) {
          await this.sendClassReminder({
            teacherId: teacher.id,
            teacherName: teacher.name,
            className: classroom.name,
            classTime: formatTime(schedule.start_time),
            location: classroom.location,
            minutesUntilClass
          });
          remindersSent++;
        }
      }

      console.log(`Sent ${remindersSent} class reminders`);
    } catch (error) {
      console.error('Error sending daily reminders:', error);
    }
  }

  // Send attendance irregularity notification
  static async sendAttendanceIrregularity(data: AttendanceIrregularityData) {
    const statusMessages = {
      late: 'arrived late to',
      absent: 'was absent from',
      early_leave: 'left early from'
    };

    const notification = {
      user_id: data.teacherId,
      user_role: 'teacher' as const,
      title: 'Attendance Irregularity',
      message: `${data.teacherName} ${statusMessages[data.status]} ${data.className} class scheduled for ${data.classTime} on ${data.date}.`,
      type: 'warning' as const,
      category: 'attendance' as const,
    };

    try {
      await createNotification(notification);
      console.log(`Attendance irregularity notification sent for ${data.teacherName}`);
    } catch (error) {
      console.error('Error sending attendance irregularity notification:', error);
    }
  }

  // Check for attendance irregularities and send notifications
  static async checkAttendanceIrregularities() {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get today's active schedules
      const schedules = await getDocuments('schedules', [
        where('day_of_week', '==', today.getDay()),
        where('active', '==', true)
      ]);

      if (schedules.length === 0) {
        console.log('No active schedules found for today');
        return;
      }

      // Get all attendance logs for today
      const attendanceLogs = await getDocuments('attendance_logs', [
        where('date', '==', todayStr)
      ]);

      // Get all teachers and classrooms
      const [allTeachers, allClassrooms] = await Promise.all([
        getDocuments('teachers'),
        getDocuments('classrooms')
      ]);

      // Create lookup maps
      const teacherMap = new Map(allTeachers.map(t => [t.id, t]));
      const classroomMap = new Map(allClassrooms.map(c => [c.id, c]));
      const logMap = new Map(attendanceLogs.map(log => [`${log.teacher_id}-${log.schedule_id}`, log]));

      let irregularitiesFound = 0;

      for (const schedule of schedules) {
        const teacher = teacherMap.get(schedule.teacher_id);
        const classroom = classroomMap.get(schedule.classroom_id);

        if (!teacher || !classroom) continue;

        // Parse schedule time
        const [scheduleHour, scheduleMinute] = schedule.start_time.split(':').map(Number);
        const scheduleTime = new Date();
        scheduleTime.setHours(scheduleHour, scheduleMinute, 0, 0);

        // Only check schedules that have already started
        if (scheduleTime > today) continue;

        const attendanceLog = logMap.get(`${teacher.id}-${schedule.id}`);

        if (!attendanceLog) {
          // Teacher is absent - no log found
          await this.sendAttendanceIrregularity({
            teacherId: teacher.id,
            teacherName: teacher.name,
            className: classroom.name,
            classTime: formatTime(schedule.start_time),
            status: 'absent',
            date: todayStr
          });
          irregularitiesFound++;
        } else if (attendanceLog.status === 'late' || attendanceLog.status === 'early_leave') {
          await this.sendAttendanceIrregularity({
            teacherId: teacher.id,
            teacherName: teacher.name,
            className: classroom.name,
            classTime: formatTime(schedule.start_time),
            status: attendanceLog.status,
            date: todayStr
          });
          irregularitiesFound++;
        }
      }

      console.log(`Found and notified ${irregularitiesFound} attendance irregularities`);
    } catch (error) {
      console.error('Error checking attendance irregularities:', error);
    }
  }
}