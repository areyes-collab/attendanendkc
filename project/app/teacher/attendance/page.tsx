'use client';

import { useEffect, useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { BarChart3, Calendar, Clock, TrendingUp } from 'lucide-react';
import { subscribeToCollection } from '@/lib/firebase';
import { where } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SidebarContext } from '../layout';

import { getCurrentUser } from '@/lib/auth';

export default function TeacherAttendancePage() {
  const user = getCurrentUser();
  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (!user?.id) {
      setError("Please log in to view your attendance");
      setIsLoading(false);
      return;
    }

    // Only set loading to true if we don't have data yet
    if (attendanceLogs.length === 0) {
      setIsLoading(true);
    }

    let unsubscribeClassrooms: (() => void) | undefined;
    let unsubscribeAttendance: (() => void) | undefined;

    try {
      // Subscribe to classrooms first
      unsubscribeClassrooms = subscribeToCollection('classrooms', (data) => {
        setClassrooms(data);
      });

      // Subscribe to teacher's attendance logs
      unsubscribeAttendance = subscribeToCollection(
        'attendance_logs',
        (data) => {
          
          // Enrich logs with classroom data
          const enrichedLogs = data.map((log: any) => {
            const classroom = classrooms.find(c => c.id === log.classroom_id);
            return {
              ...log,
              classroom
            };
          });

          // Sort by date and time (most recent first)
          const sortedLogs = enrichedLogs.sort((a, b) => {
            const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return b.scan_time.localeCompare(a.scan_time);
          });

          setAttendanceLogs(sortedLogs);
          setIsLoading(false);
          setError(null);
        },
        [where('teacher_id', '==', user.id)]
      );
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError("Failed to load attendance data. Please try again later.");
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeClassrooms) unsubscribeClassrooms();
      if (unsubscribeAttendance) unsubscribeAttendance();
    };
  }, [user?.id]); // Removed classrooms dependency to prevent re-fetching

  // Separate effect to enrich attendance logs with classroom data when classrooms change
  useEffect(() => {
    if (attendanceLogs.length > 0 && classrooms.length > 0) {
      const enrichedLogs = attendanceLogs.map((log: any) => {
        const classroom = classrooms.find(c => c.id === log.classroom_id);
        return {
          ...log,
          classroom
        };
      });
      
      // Only update if the enrichment actually changed something
      const hasChanges = enrichedLogs.some((log, index) => 
        log.classroom !== attendanceLogs[index]?.classroom
      );
      
      if (hasChanges) {
        setAttendanceLogs(enrichedLogs);
      }
    }
  }, [classrooms]);

  const getFilteredLogs = () => {
    return attendanceLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() + 1 === filters.month && 
             logDate.getFullYear() === filters.year;
    });
  };

  const getAttendanceStats = () => {
    const filteredLogs = getFilteredLogs();
    const scanInLogs = filteredLogs.filter(log => log.scan_type === 'in');
    
    const onTimeCount = scanInLogs.filter(log => log.status === 'on_time').length;
    const lateCount = scanInLogs.filter(log => log.status === 'late').length;
    const absentCount = scanInLogs.filter(log => log.status === 'absent').length;
    const totalClasses = onTimeCount + lateCount + absentCount;
    
    return {
      onTimeCount,
      lateCount,
      absentCount,
      totalClasses,
      punctualityRate: totalClasses > 0 ? Math.round((onTimeCount / totalClasses) * 100) : 0
    };
  };

  const getWeeklyData = () => {
    const filteredLogs = getFilteredLogs();
    const weeklyStats: Record<string, any> = {};
    
    filteredLogs.forEach(log => {
      if (log.scan_type === 'in') {
        const date = new Date(log.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Go to start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyStats[weekKey]) {
          const weekNumber = Math.ceil(date.getDate() / 7);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          weeklyStats[weekKey] = { 
            week: `${monthName} W${weekNumber}`, 
            onTime: 0, 
            late: 0, 
            absent: 0,
            earlyLeave: 0
          };
        }
        
        // Count the status
        if (log.status === 'on_time') {
          weeklyStats[weekKey].onTime++;
        } else if (log.status === 'late') {
          weeklyStats[weekKey].late++;
        } else if (log.status === 'absent') {
          weeklyStats[weekKey].absent++;
        } else if (log.status === 'early_leave') {
          weeklyStats[weekKey].earlyLeave++;
        }
      }
    });

    const result = Object.values(weeklyStats).slice(-4); // Last 4 weeks
    return result;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_time':
        return <Badge className="bg-green-100 text-green-800 border-green-200">On Time</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Late</Badge>;
      case 'early_leave':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Early Leave</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Absent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = getAttendanceStats();
  const weeklyData = getWeeklyData();
  const filteredLogs = getFilteredLogs().slice(0, 20); // Show last 20 records

  if (isLoading && attendanceLogs.length === 0) {
    return (
      <div className="h-full bg-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading attendance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-100 flex flex-col">
        <PageHeader 
          title="My Attendance"
          subtitle="Track your attendance history and performance"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 mb-4 font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <PageHeader 
        title="My Attendance"
        subtitle="Track your attendance history and performance"
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={isCollapsed}
      />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter by Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="month">Month</Label>
                    <Select
                      value={filters.month.toString()}
                      onChange={(e) => setFilters({...filters, month: parseInt(e.target.value)})}
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Select
                      value={filters.year.toString()}
                      onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
                    >
                      {Array.from({length: 5}, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClasses}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">On Time</CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{stats.onTimeCount}</div>
                  <p className="text-xs text-muted-foreground">{stats.punctualityRate}% punctuality</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
                  <Clock className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{stats.lateCount}</div>
                  <p className="text-xs text-muted-foreground">Need improvement</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Absences</CardTitle>
                  <BarChart3 className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.absentCount}</div>
                  <p className="text-xs text-muted-foreground">Missed classes</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="onTime" fill="#22c55e" name="On Time" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="late" fill="#eab308" name="Late" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="earlyLeave" fill="#f97316" name="Early Leave" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <TrendingUp className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No attendance data available</p>
                        <p className="text-gray-400 text-sm mt-1">for the selected period</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Attendance */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {filteredLogs.map((log) => (
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
                    ))}

                    {filteredLogs.length === 0 && (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No attendance records found for this period.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>
      </main>
    </div>
  );
}