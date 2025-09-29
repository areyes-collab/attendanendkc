'use client';

import { useEffect, useState, useContext } from 'react';
import { SidebarContext } from './layout';

interface AttendanceData {
  day: string;
  onTime: number;
  late: number;
  absent: number;
  earlyLeave: number;
  total: number;
  date?: string;
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Calendar, UserCheck, Clock, TrendingUp } from 'lucide-react';
import { subscribeToCollection } from '@/lib/firebase';
import { useUser } from '@/hooks/useUser';
import { PageHeader } from '@/components/layout/page-header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
      startOfWeek.setDate(now.getDate() - now.getDay()); // Go to start of week (Sunday)
      
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
          total: teachers.length // Total expected attendance
        };
      });

      setAttendanceChart(weeklyData);
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeClassrooms();
      unsubscribeSchedules();
      unsubscribeAttendance();
    };
  }, []);

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title="Admin Dashboard"
          subtitle="Overview of attendance, schedules, and teacher statistics"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                  <p className="text-xs text-muted-foreground">Active teachers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClassrooms}</div>
                  <p className="text-xs text-muted-foreground">Available rooms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Schedules</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSchedules}</div>
                  <p className="text-xs text-muted-foreground">Active schedules</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Scans</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayAttendance}</div>
                  <p className="text-xs text-muted-foreground">RFID scans today</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Weekly Attendance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="text-sm text-gray-600">On Time</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-yellow-500" />
                        <span className="text-sm text-gray-600">Late</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-orange-500" />
                        <span className="text-sm text-gray-600">Early Leave</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-sm text-gray-600">Absent</span>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={attendanceChart} 
                      stackOffset="sign"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        label={{ 
                          value: 'Teachers', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: '#6b7280', fontSize: 12 }
                        }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          return [value, name.replace(/([A-Z])/g, ' $1').trim()];
                        }}
                        labelFormatter={(label: string) => `${label}'s Attendance`}
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
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
                        fill="#eab308" 
                        name="Late"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="earlyLeave" 
                        stackId="a" 
                        fill="#f97316" 
                        name="Early Leave"
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
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-800">Average On-Time Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Math.min(100, Math.round(
                            (attendanceChart.reduce((acc, day) => acc + day.onTime, 0) * 100) /
                            Math.max(1, attendanceChart.reduce((acc, day) => acc + (day.onTime + day.late + day.absent + day.earlyLeave), 0))
                          ))}%
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-sm font-medium text-red-800">Absence Rate</p>
                        <p className="text-2xl font-bold text-red-600">
                          {Math.min(100, Math.round(
                            (attendanceChart.reduce((acc, day) => acc + day.absent, 0) * 100) /
                            Math.max(1, attendanceChart.reduce((acc, day) => acc + (day.onTime + day.late + day.absent + day.earlyLeave), 0))
                          ))}%
                        </p>
                      </div>
                    </div>
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
                    {recentAttendance.length === 0 ? (
                      <div className="text-center py-6">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No recent attendance records</p>
                      </div>
                    ) : (
                      recentAttendance.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className={`p-2 rounded-full ${
                            log.status === 'on_time' ? 'bg-green-100' :
                            log.status === 'late' ? 'bg-yellow-100' :
                            log.status === 'early_leave' ? 'bg-orange-100' :
                            'bg-red-100'
                          }`}>
                            <Clock className={`h-5 w-5 ${
                              log.status === 'on_time' ? 'text-green-600' :
                              log.status === 'late' ? 'text-yellow-600' :
                              log.status === 'early_leave' ? 'text-orange-600' :
                              'text-red-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{log.teachers?.name || 'Unknown Teacher'}</p>
                            <p className="text-sm text-gray-600">
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
                          <div>
                            {getStatusBadge(log.status)}
                          </div>
                        </div>
                      ))
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