'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BarChart3, Download, Calendar, TrendingUp, Users, Clock, FileText } from 'lucide-react';
import { generateWordReport } from '@/lib/word-export';
import { getDocuments } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function ReportsPage() {
  // State for data
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionLoading, setSectionLoading] = useState({
    teachers: false,
    attendance: false,
    charts: false
  });

  // UI state
  const [reportType, setReportType] = useState('overview');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Fetch teachers
      setSectionLoading(prev => ({ ...prev, teachers: true }));
      const teachers = await getDocuments('teachers');
      setTeachers(teachers);
      setSectionLoading(prev => ({ ...prev, teachers: false }));

      // Fetch attendance data
      setSectionLoading(prev => ({ ...prev, attendance: true }));
      const allLogs = await getDocuments('attendance_logs');
      const logs = allLogs.filter(log => 
        log.date >= dateRange.start && log.date <= dateRange.end
      );
      setAttendanceData(logs);
      setSectionLoading(prev => ({ ...prev, attendance: false }));

    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  const getOverviewStats = () => {
    const totalScans = attendanceData.length;
    const onTimeCount = attendanceData.filter(log => log.status === 'on_time' && log.scan_type === 'in').length;
    const lateCount = attendanceData.filter(log => log.status === 'late').length;
    const absentCount = attendanceData.filter(log => log.status === 'absent').length;
    const earlyLeaveCount = attendanceData.filter(log => log.status === 'early_leave').length;

    return {
      totalScans,
      onTimeCount,
      lateCount,
      absentCount,
      earlyLeaveCount,
      punctualityRate: totalScans > 0 ? Math.round((onTimeCount / totalScans) * 100) : 0
    };
  };

  const getWeeklyData = () => {
    const weeklyStats: Record<string, any> = {};
    attendanceData.forEach(log => {
      const date = new Date(log.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = { week: weekKey, onTime: 0, late: 0, absent: 0 };
      }
      
      if (log.scan_type === 'in') {
        weeklyStats[weekKey][log.status === 'on_time' ? 'onTime' : log.status]++;
      }
    });

    return Object.values(weeklyStats).slice(-8);
  };

  const getStatusDistribution = () => {
    const stats = getOverviewStats();
    return [
      { name: 'On Time', value: stats.onTimeCount, color: 'rgb(var(--success))' },
      { name: 'Late', value: stats.lateCount, color: 'rgb(var(--warning))' },
      { name: 'Absent', value: stats.absentCount, color: 'rgb(var(--destructive))' },
      { name: 'Early Leave', value: stats.earlyLeaveCount, color: 'rgb(var(--accent))' },
    ].filter(item => item.value > 0);
  };

  const getTeacherStats = () => {
    const teacherStats: Record<string, any> = {};
    
    attendanceData.forEach(log => {
      if (!teacherStats[log.teacher_id]) {
        const teacher = teachers.find(t => t.id === log.teacher_id);
        teacherStats[log.teacher_id] = {
          name: teacher?.name || 'Unknown',
          onTime: 0,
          late: 0,
          absent: 0,
          total: 0
        };
      }
      
      if (log.scan_type === 'in') {
        teacherStats[log.teacher_id][log.status === 'on_time' ? 'onTime' : log.status]++;
        teacherStats[log.teacher_id].total++;
      }
    });

    return Object.values(teacherStats).map((stats: any) => ({
      ...stats,
      punctualityRate: stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0
    }));
  };

  const exportReport = () => {
    const report = {
      overview: getOverviewStats(),
      weeklyTrends: getWeeklyData(),
      statusDistribution: getStatusDistribution(),
      teacherPerformance: getTeacherStats(),
      dateRange,
      generatedAt: new Date().toISOString()
    };

    // Convert data to CSV format
    const csvData = [
      // Header
      ['Attendance Report', ''],
      [`Generated on: ${new Date().toLocaleString()}`, ''],
      [`Date Range: ${dateRange.start} to ${dateRange.end}`, ''],
      ['', ''],
      ['Overview Statistics', ''],
      ['Metric', 'Value'],
      ['Total Scans', report.overview.totalScans],
      ['On Time', report.overview.onTimeCount],
      ['Late', report.overview.lateCount],
      ['Absent', report.overview.absentCount],
      ['Early Leave', report.overview.earlyLeaveCount],
      ['Punctuality Rate', `${report.overview.punctualityRate}%`],
      ['', ''],
      ['Teacher Performance', ''],
      ['Name', 'On Time', 'Late', 'Absent', 'Total Classes', 'Punctuality Rate'],
      ...report.teacherPerformance.map(teacher => [
        teacher.name,
        teacher.onTime,
        teacher.late,
        teacher.absent,
        teacher.total,
        `${teacher.punctualityRate}%`
      ]),
      ['', ''],
      ['Weekly Trends', ''],
      ['Week', 'On Time', 'Late', 'Absent'],
      ...report.weeklyTrends.map(week => [
        week.week,
        week.onTime,
        week.late,
        week.absent
      ])
    ];

    // Convert to CSV string
    const csvContent = csvData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_report_${dateRange.start}_to_${dateRange.end}.csv`;
    link.click();
  };

  const stats = getOverviewStats();
  const weeklyData = getWeeklyData();
  const statusDistribution = getStatusDistribution();
  const teacherStats = getTeacherStats();

  if (isLoading) {
    return (
      <div className="h-full bg-gray-100">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-100">
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="text-destructive mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reports</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchData()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600">Comprehensive attendance insights and statistics</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={exportReport}
                  disabled={isLoading || sectionLoading.attendance || sectionLoading.teachers}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => generateWordReport(stats, teacherStats, weeklyData, dateRange)}
                  disabled={isLoading || sectionLoading.attendance || sectionLoading.teachers}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Word
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Report Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option value="overview">Overview</option>
                      <option value="teacher">Teacher Performance</option>
                      <option value="trends">Trends Analysis</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalScans}</div>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">On Time</CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{stats.onTimeCount}</div>
                  <p className="text-xs text-muted-foreground">{stats.punctualityRate}% punctuality rate</p>
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
                  <Users className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.absentCount}</div>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {sectionLoading.attendance ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading chart data...</p>
                      </div>
                    </div>
                  ) : weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="onTime" fill="rgb(var(--success))" name="On Time" />
                        <Bar dataKey="late" fill="rgb(var(--warning))" name="Late" />
                        <Bar dataKey="absent" fill="rgb(var(--destructive))" name="Absent" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-gray-500">No data available for the selected period</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Teacher Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Teacher Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherStats.map((teacher, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{teacher.name}</h3>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-green-600">On Time: {teacher.onTime}</span>
                          <span className="text-yellow-600">Late: {teacher.late}</span>
                          <span className="text-red-600">Absent: {teacher.absent}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={teacher.punctualityRate >= 90 ? 'success' : teacher.punctualityRate >= 70 ? 'warning' : 'destructive'}>
                          {teacher.punctualityRate}% Punctual
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Total: {teacher.total} classes
                        </p>
                      </div>
                    </div>
                  ))}

                  {teacherStats.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No teacher data available for the selected period.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}