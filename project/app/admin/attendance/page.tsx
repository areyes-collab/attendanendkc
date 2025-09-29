'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UserCheck, Clock, Calendar, Filter, Download, Search, ArrowUpDown, Info } from 'lucide-react';
import { getDocuments } from '@/lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface AttendanceLog {
  id: string;
  teacher_id: string;
  classroom_id: string;
  date: string;
  scan_time: string;
  scan_type: 'in' | 'out';
  status: 'on_time' | 'late' | 'early_leave' | 'absent';
  created_at: string;
  teacher?: {
    id: string;
    name: string;
  };
  classroom?: {
    id: string;
    name: string;
    location: string;
  };
}

interface DetailDialogProps {
  log: AttendanceLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getStatusBadge: (status: AttendanceLog['status']) => JSX.Element;
  getScanTypeBadge: (scanType: AttendanceLog['scan_type']) => JSX.Element;
}

const DetailDialog = ({ log, open, onOpenChange, getStatusBadge, getScanTypeBadge }: DetailDialogProps) => {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attendance Record Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Teacher</Label>
            <div className="col-span-3">
              <p className="font-medium">{log.teacher?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Classroom</Label>
            <div className="col-span-3">
              <p className="font-medium">{log.classroom?.name || 'N/A'}</p>
              {log.classroom?.location && (
                <p className="text-sm text-gray-500">{log.classroom.location}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date</Label>
            <div className="col-span-3">
              <p className="font-medium">
                {log.date ? new Date(log.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Time</Label>
            <div className="col-span-3">
              <p className="font-medium">
                {log.scan_time ? new Date(`2000-01-01T${log.scan_time}`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                }) : 'N/A'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <div className="col-span-3">
              {log.scan_type ? getScanTypeBadge(log.scan_type) : 'N/A'}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <div className="col-span-3">
              {log.status ? getStatusBadge(log.status) : 'N/A'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getStatusBadge = (status: AttendanceLog['status']) => {
  switch (status) {
    case 'on_time':
      return <Badge className="bg-green-500">On Time</Badge>;
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

const getScanTypeBadge = (scanType: AttendanceLog['scan_type']) => {
  return (
    <Badge variant={scanType === 'in' ? 'default' : 'outline'}>
      {scanType === 'in' ? 'Scan In' : 'Scan Out'}
    </Badge>
  );
};

export default function AttendancePage() {
  // State declarations
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [page, setPage] = useState<number>(1);
  const [filters, setFilters] = useState({
    teacher: '',
    classroom: '',
    status: '',
    date: '',
    search: '',
  });
  const [sorting, setSorting] = useState({
    field: 'created_at' as keyof AttendanceLog,
    direction: 'desc' as 'asc' | 'desc'
  });

  // Constants
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachers, classrooms] = await Promise.all([
        getDocuments('teachers'),
        getDocuments('classrooms'),
      ]);

      setTeachers(teachers);
      setClassrooms(classrooms);

      const allLogs = await getDocuments('attendance_logs');
      const enrichedLogs = allLogs.map((log: AttendanceLog) => {
        const teacher = teachers.find(t => t.id === log.teacher_id);
        const classroom = classrooms.find(c => c.id === log.classroom_id);
        return {
          ...log,
          teacher,
          classroom
        };
      });

      setAttendanceLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleSort = (field: keyof AttendanceLog) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortData = (data: AttendanceLog[]) => {
    return [...data].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      // Handle nested properties and convert to sortable values
      if (sorting.field === 'teacher') {
        aValue = a.teacher?.name ?? '';
        bValue = b.teacher?.name ?? '';
      } else if (sorting.field === 'classroom') {
        aValue = a.classroom?.name ?? '';
        bValue = b.classroom?.name ?? '';
      } else if (sorting.field === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (sorting.field === 'scan_time') {
        aValue = new Date(`2000-01-01T${a.scan_time}`).getTime();
        bValue = new Date(`2000-01-01T${b.scan_time}`).getTime();
      } else if (sorting.field === 'status' || sorting.field === 'scan_type') {
        aValue = a[sorting.field] ?? '';
        bValue = b[sorting.field] ?? '';
      } else {
        aValue = (a[sorting.field] as string) ?? '';
        bValue = (b[sorting.field] as string) ?? '';
      }

      if (aValue < bValue) return sorting.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredLogs = attendanceLogs
    .filter(log => {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = !filters.search || 
        log.teacher?.name.toLowerCase().includes(searchTerm) ||
        log.classroom?.name.toLowerCase().includes(searchTerm);

      return (
        matchesSearch &&
        (!filters.teacher || log.teacher_id === filters.teacher) &&
        (!filters.classroom || log.classroom_id === filters.classroom) &&
        (!filters.status || log.status === filters.status) &&
        (!filters.date || log.date === filters.date)
      );
    });

  const sortedLogs = sortData(filteredLogs);

  if (isLoading) {
    return (
      <div className="h-full bg-gray-100">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading attendance data...</p>
          </div>
        </div>
      </div>
    );
  }

  const exportToCSV = () => {
    const headers = ['Teacher', 'Classroom', 'Date', 'Time', 'Type', 'Status'];
    const rows = sortedLogs.map(log => [
      log.teacher?.name,
      log.classroom?.name,
      new Date(log.date).toLocaleDateString(),
      new Date(`2000-01-01T${log.scan_time}`).toLocaleTimeString(),
      log.scan_type,
      log.status
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const paginatedLogs = sortedLogs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);

    return (
    <div className="h-full bg-gray-100">
      <DetailDialog
        log={selectedLog}
        open={selectedLog !== null}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        getStatusBadge={getStatusBadge}
        getScanTypeBadge={getScanTypeBadge}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
                <p className="text-gray-600">View and manage teacher attendance logs</p>
              </div>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="search"
                        placeholder="Search teachers or classrooms..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="teacher-filter">Teacher</Label>
                    <Select
                      value={filters.teacher}
                      onChange={(e) => setFilters({...filters, teacher: e.target.value})}
                    >
                      <option value="">All Teachers</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="classroom-filter">Classroom</Label>
                    <Select
                      value={filters.classroom}
                      onChange={(e) => setFilters({...filters, classroom: e.target.value})}
                    >
                      <option value="">All Classrooms</option>
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <Select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                      <option value="">All Statuses</option>
                      <option value="on_time">On Time</option>
                      <option value="late">Late</option>
                      <option value="early_leave">Early Leave</option>
                      <option value="absent">Absent</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date-filter">Date</Label>
                    <Input
                      id="date-filter"
                      type="date"
                      value={filters.date}
                      onChange={(e) => setFilters({...filters, date: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Attendance Logs ({sortedLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('teacher')}
                            className="flex items-center gap-1 font-semibold"
                          >
                            Teacher
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('classroom')}
                            className="flex items-center gap-1 font-semibold"
                          >
                            Classroom
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('date')}
                            className="flex items-center gap-1 font-semibold"
                          >
                            Date
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('scan_time')}
                            className="flex items-center gap-1 font-semibold"
                          >
                            Time
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('status')}
                            className="flex items-center gap-1 font-semibold"
                          >
                            Status
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="w-[50px]">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.teacher?.name}</TableCell>
                          <TableCell>
                            <div>
                              <div>{log.classroom?.name}</div>
                              <div className="text-sm text-gray-500">{log.classroom?.location}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(log.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            {new Date(`2000-01-01T${log.scan_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </TableCell>
                          <TableCell>{getScanTypeBadge(log.scan_type)}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {paginatedLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                              <p className="text-gray-600">Try adjusting your filters or check back later.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, sortedLogs.length)} of {sortedLogs.length} records
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}