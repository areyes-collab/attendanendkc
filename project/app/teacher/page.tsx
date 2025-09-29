'use client';

import { useEffect, useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Clock, Calendar, TrendingUp, UserCheck, RefreshCw } from 'lucide-react';
import { subscribeToCollection } from '@/lib/firebase';
import { where } from 'firebase/firestore';
import { formatTime } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SidebarContext } from './layout';
import type { Schedule, Classroom, AttendanceLog } from '@/lib/firebase';

interface TeacherStats {
  onTimeCount: number;
  lateCount: number;
  absentCount: number;
  totalHours: number;
}

interface EnrichedSchedule extends Schedule {
  classroom?: Classroom;
}

interface EnrichedAttendanceLog extends AttendanceLog {
  classroom?: Classroom;
}

export default function TeacherDashboard() {
  const { user } = useUser();
  const { showToast } = useToast();
  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<EnrichedSchedule[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<EnrichedAttendanceLog[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [stats, setStats] = useState<TeacherStats>({
    onTimeCount: 0,
    lateCount: 0,
    absentCount: 0,
    totalHours: 0,
  });

  const refreshData = () => {
    setIsLoading(true);
    setError(null);
    // The real-time subscriptions will automatically refresh the data
    showToast("Your dashboard is being updated with the latest information.", "info");
  };

  useEffect(() => {
    if (!user?.id) {
      setError("Please log in to view your dashboard");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().getDay();
      let unsubscribeClassrooms: () => void;
      let unsubscribeSchedules: () => void;
      let unsubscribeAttendance: () => void;

      // Subscribe to classrooms
      unsubscribeClassrooms = subscribeToCollection('classrooms', (data) => {
        setClassrooms(data as Classroom[]);
      });

      // Subscribe to teacher's schedules for today
      unsubscribeSchedules = subscribeToCollection(
        'schedules',
        (data) => {
          const todaySchedules = (data as Schedule[]).filter(schedule => 
            schedule.day_of_week === today
          );
          
          // Enrich with classroom data
          const enrichedSchedules = todaySchedules.map((schedule) => {
            const classroom = classrooms.find(c => c.id === schedule.classroom_id);
            return {
              ...schedule,
              classroom
            };
          });

          setTodaySchedule(enrichedSchedules);
        },
        [where('teacher_id', '==', user.id)]
      );

      // Subscribe to teacher's attendance logs
      unsubscribeAttendance = subscribeToCollection(
        'attendance_logs',
        (data) => {
          // Sort by created_at and take last 10
          const sortedLogs = (data as AttendanceLog[])
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10);
          
          // Enrich with classroom data
          const enrichedLogs = sortedLogs.map((log) => {
            const classroom = classrooms.find(c => c.id === log.classroom_id);
            return {
              ...log,
              classroom
            };
          });

          setRecentAttendance(enrichedLogs);

          // Calculate stats (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const recentLogs = data.filter(log => 
            new Date(log.date) >= thirtyDaysAgo
          );

          if (recentLogs.length > 0) {
            const onTime = recentLogs.filter(log => log.status === 'on_time' && log.scan_type === 'in').length;
            const late = recentLogs.filter(log => log.status === 'late').length;
            const absent = recentLogs.filter(log => log.status === 'absent').length;

            setStats({
              onTimeCount: onTime,
              lateCount: late,
              absentCount: absent,
              totalHours: Math.round((onTime + late) * 2.5), // Assuming 2.5 hours per class
            });
          }
          
          setIsLoading(false);
        },
        [where('teacher_id', '==', user.id)]
      );

      return () => {
        unsubscribeClassrooms();
        unsubscribeSchedules();
        unsubscribeAttendance();
      };
    } catch (err) {
      setError("Failed to load dashboard data. Please try again later.");
      setIsLoading(false);
    }
  }, [user?.id]);

  const getStatusBadge = (status: AttendanceLog['status']) => {
    switch (status) {
      case 'on_time':
        return <Badge variant="success">On Time</Badge>;
      case 'late':
        return <Badge variant="warning">Late</Badge>;
      case 'early_leave':
        return <Badge variant="warning">Early Leave</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="h-full bg-gray-100">
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageHeader 
            title="Teacher Dashboard"
            subtitle="Overview of your attendance and schedule"
            onToggleSidebar={toggleSidebar}
            isSidebarCollapsed={isCollapsed}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={refreshData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title="Teacher Dashboard"
          subtitle="Overview of your attendance and schedule"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <Button onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">On Time</CardTitle>
                  <UserCheck className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold text-success ${isLoading ? 'animate-pulse' : ''}`}>
                    {stats.onTimeCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
                  <Clock className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold text-secondary ${isLoading ? 'animate-pulse' : ''}`}>
                    {stats.lateCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Absences</CardTitle>
                  <Calendar className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold text-destructive ${isLoading ? 'animate-pulse' : ''}`}>
                    {stats.absentCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold text-accent ${isLoading ? 'animate-pulse' : ''}`}>
                    {stats.totalHours}
                  </div>
                  <p className="text-xs text-muted-foreground">Teaching hours</p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-gray-200 rounded-lg" />
                        ))}
                      </div>
                    ) : todaySchedule.length > 0 ? (
                      todaySchedule.map((schedule) => (
                        <div key={schedule.id} className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{schedule.classroom?.name}</h3>
                              <p className="text-sm text-gray-600">{schedule.classroom?.location}</p>
                              <p className="text-sm font-medium mt-1">
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </p>
                            </div>
                            <Badge variant="outline">
                              Grace: {schedule.grace_period_minutes}min
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No classes scheduled for today</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Attendance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
                        ))}
                      </div>
                    ) : recentAttendance.length > 0 ? (
                      recentAttendance.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{log.classroom?.name}</p>
                            <p className="text-sm text-gray-600">
                              {log.scan_type === 'in' ? 'Scanned In' : 'Scanned Out'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.date).toLocaleDateString()} at{' '}
                              {new Date(`2000-01-01T${log.scan_time}`).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </p>
                          </div>
                          <div>
                            {getStatusBadge(log.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No recent attendance records</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}