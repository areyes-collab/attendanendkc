'use client';

import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { SidebarContext } from './layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingCard } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Calendar, UserCheck, Clock, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import { subscribeToCollection } from '@/lib/firebase';
import { useUser } from '@/hooks/useUser';
import { PageHeader } from '@/components/layout/page-header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AttendanceData {
  day: string;
  onTime: number;
  late: number;
  absent: number;
  earlyLeave: number;
  total: number;
  date?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function AdminDashboard() {
  const { user } = useUser();
  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalClassrooms: 0,
    totalSchedules: 0,
    todayAttendance: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [attendanceChart, setAttendanceChart] = useState<AttendanceData[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // Subscribe to teachers
    const unsubscribeTeachers = subscribeToCollection('teachers', (data) => {
      setTeachers(data);
      setStats(prev => ({ ...prev, totalTeachers: data.length }));
    });

    // Subscribe to classrooms
    const unsubscribeClassrooms = subscribeToCollection('classrooms', (data) => {
      setClassrooms(data);
      setStats(prev => ({ ...prev, totalClassrooms: data.length }));
    });

    // Subscribe to schedules
    const unsubscribeSchedules = subscribeToCollection('schedules', (data) => {
      setStats(prev => ({ ...prev, totalSchedules: data.length }));
    });

    // Subscribe to attendance logs
    const unsubscribeAttendance = subscribeToCollection('attendance_logs', (data) => {
      // Filter today's attendance
      const todayAttendance = data.filter(log => log.date === today);
      setStats(prev => ({ ...prev, todayAttendance: todayAttendance.length }));

      // Get recent attendance (last 10)
      const recentLogs = data
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      // Enrich with teacher and classroom data
      const enrichedLogs = recentLogs.map((log: any) => {
        const teacher = teachers.find(t => t.id === log.teacher_id);
        const classroom = classrooms.find(c => c.id === log.classroom_id);
        
        return {
          ...log,
          teachers: teacher || null,
          classrooms: classroom || null
        };
      });

      setRecentAttendance(enrichedLogs);

      // Calculate weekly attendance data
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData = weekDays.map((day, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        const dateStr = date.toISOString().split('T')[0];

        const dayLogs = data.filter(log => log.date === dateStr);
        
        return {
          day,
          onTime: dayLogs.filter(log => log.status === 'on_time').length,
          late: dayLogs.filter(log => log.status === 'late').length,
          absent: dayLogs.filter(log => log.status === 'absent').length,
          earlyLeave: dayLogs.filter(log => log.status === 'early_leave').length,
          total: teachers.length
        };
      });

      setAttendanceChart(weeklyData);
      setIsLoading(false);
      setLastRefresh(new Date());
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeClassrooms();
      unsubscribeSchedules();
      unsubscribeAttendance();
    };
  }, [teachers, classrooms]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_time':
        return <Badge variant="success" size="sm">On Time</Badge>;
      case 'late':
        return <Badge variant="warning" size="sm">Late</Badge>;
      case 'early_leave':
        return <Badge variant="warning" size="sm">Early Leave</Badge>;
      case 'absent':
        return <Badge variant="destructive" size="sm">Absent</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    setLastRefresh(new Date());
    // The subscriptions will automatically refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (isLoading && stats.totalTeachers === 0) {
    return (
      <div className="h-full page-container">
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageHeader 
            title="Admin Dashboard"
            subtitle="Overview of attendance, schedules, and teacher statistics"
            onToggleSidebar={toggleSidebar}
            isSidebarCollapsed={isCollapsed}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="content-wrapper">
              <LoadingCard 
                title="Loading Dashboard"
                description="Fetching the latest attendance data and statistics..."
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full page-container">
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title="Admin Dashboard"
          subtitle="Overview of attendance, schedules, and teacher statistics"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
          actions={
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="content-wrapper">
            <motion.div 
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Stats Cards */}
              <motion.div variants={itemVariants}>
                <div className="stats-grid">
                  <StatCard
                    title="Total Teachers"
                    value={stats.totalTeachers}
                    subtitle="Active teaching staff"
                    icon={Users}
                    variant="primary"
                  />
                  
                  <StatCard
                    title="Classrooms"
                    value={stats.totalClassrooms}
                    subtitle="Available rooms"
                    icon={MapPin}
                    variant="accent"
                  />
                  
                  <StatCard
                    title="Active Schedules"
                    value={stats.totalSchedules}
                    subtitle="Current semester"
                    icon={Calendar}
                    variant="secondary"
                  />
                  
                  <StatCard
                    title="Today's Scans"
                    value={stats.todayAttendance}
                    subtitle="RFID scans today"
                    icon={UserCheck}
                    variant="success"
                  />
                </div>
              </motion.div>

              {/* Charts and Recent Activity */}
              <div className="content-grid">
                {/* Attendance Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary-600" />
                        Weekly Attendance Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-success-500" />
                              <span className="text-sm text-gray-600 font-medium">On Time</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-warning-500" />
                              <span className="text-sm text-gray-600 font-medium">Late</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-destructive-500" />
                              <span className="text-sm text-gray-600 font-medium">Absent</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart 
                          data={attendanceChart} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickLine={{ stroke: '#e2e8f0' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis 
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickLine={{ stroke: '#e2e8f0' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                              fontSize: '12px'
                            }}
                          />
                          <Bar 
                            dataKey="onTime" 
                            stackId="a" 
                            fill="#22c55e" 
                            name="On Time"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="late" 
                            stackId="a" 
                            fill="#f59e0b" 
                            name="Late"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="absent" 
                            stackId="a" 
                            fill="#ef4444" 
                            name="Absent"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                      
                      {/* Summary Stats */}
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-success-50 p-4 rounded-xl border border-success-200">
                          <p className="text-sm font-semibold text-success-800">Average On-Time Rate</p>
                          <p className="text-2xl font-bold text-success-600 mt-1">
                            {Math.min(100, Math.round(
                              (attendanceChart.reduce((acc, day) => acc + day.onTime, 0) * 100) /
                              Math.max(1, attendanceChart.reduce((acc, day) => acc + (day.onTime + day.late + day.absent + day.earlyLeave), 0))
                            ))}%
                          </p>
                        </div>
                        <div className="bg-destructive-50 p-4 rounded-xl border border-destructive-200">
                          <p className="text-sm font-semibold text-destructive-800">Absence Rate</p>
                          <p className="text-2xl font-bold text-destructive-600 mt-1">
                            {Math.min(100, Math.round(
                              (attendanceChart.reduce((acc, day) => acc + day.absent, 0) * 100) /
                              Math.max(1, attendanceChart.reduce((acc, day) => acc + (day.onTime + day.late + day.absent + day.earlyLeave), 0))
                            ))}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Recent Attendance */}
                <motion.div variants={itemVariants}>
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-accent-600" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentAttendance.length === 0 ? (
                          <EmptyState
                            icon={Clock}
                            title="No Recent Activity"
                            description="Attendance records will appear here as teachers scan in and out."
                          />
                        ) : (
                          recentAttendance.map((log) => (
                            <motion.div 
                              key={log.id} 
                              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className={cn(
                                'p-3 rounded-xl shadow-sm transition-colors',
                                log.status === 'on_time' ? 'bg-success-100 text-success-600' :
                                log.status === 'late' ? 'bg-warning-100 text-warning-600' :
                                log.status === 'early_leave' ? 'bg-warning-100 text-warning-600' :
                                'bg-destructive-100 text-destructive-600'
                              )}>
                                <Clock className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {log.teachers?.name || 'Unknown Teacher'}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                  {log.classrooms?.name || 'Unknown Room'} • {log.scan_type === 'in' ? 'Arrival' : 'Departure'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-gray-500">
                                    {new Date(log.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </p>
                                  <span className="text-xs text-gray-400">•</span>
                                  <p className="text-xs text-gray-500">
                                    {new Date(`2000-01-01T${log.scan_time}`).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true,
                                    })}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(log.status)}
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}