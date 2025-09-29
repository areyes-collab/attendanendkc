'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Scan, Clock, MapPin, User } from 'lucide-react';
import { getDocuments, createDocument } from '@/lib/firebase';
import { calculateAttendanceStatus } from '@/lib/utils';
import { NotificationService } from '@/lib/notification-service';

export function AdminRFIDScanner() {
  const [rfidInput, setRfidInput] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersData, classroomsData] = await Promise.all([
        getDocuments('teachers'),
        getDocuments('classrooms'),
      ]);
      setTeachers(teachersData);
      setClassrooms(classroomsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleRFIDScan = async () => {
    if (!rfidInput.trim()) return;

    // Find teacher by RFID
    const teacher = teachers.find(t => t.rfid_id === rfidInput.trim());
    if (teacher) {
      setSelectedTeacher(teacher.id);
      setRfidInput('');
    } else {
      alert('RFID not found. Please check the card or register the teacher first.');
    }
  };

  const handleScan = async (scanType: 'in' | 'out') => {
    if (!selectedTeacher || !selectedClassroom) {
      alert('Please select both teacher and classroom');
      return;
    }

    setIsScanning(true);
    try {
      const today = new Date().getDay();
      const currentTime = new Date().toTimeString().slice(0, 5);
      const currentDate = new Date().toISOString().split('T')[0];

      // Find schedule for this teacher, classroom, and day (filter in memory)
      const allSchedules = await getDocuments('schedules');
      const schedules = allSchedules.filter(schedule =>
        schedule.teacher_id === selectedTeacher &&
        schedule.classroom_id === selectedClassroom &&
        schedule.day_of_week === today
      );
      
      const schedule = schedules[0];
      if (!schedule) {
        alert('No schedule found for this teacher and classroom today');
        return;
      }

      // Get teacher and classroom details
      const teacher = teachers.find(t => t.id === selectedTeacher);
      const classroom = classrooms.find(c => c.id === selectedClassroom);

      // Calculate attendance status
      let status: 'on_time' | 'late' | 'absent' | 'early_leave' = 'on_time';
      
      if (scanType === 'in') {
        status = calculateAttendanceStatus(
          currentTime,
          schedule.start_time,
          schedule.grace_period_minutes
        );
      } else {
        const endTime = new Date(`2000-01-01T${schedule.end_time}`);
        const scanTime = new Date(`2000-01-01T${currentTime}`);
        if (scanTime < endTime) {
          status = 'early_leave';
        }
      }

      // Record attendance
      const attendanceData = {
        teacher_id: selectedTeacher,
        classroom_id: selectedClassroom,
        schedule_id: schedule.id,
        scan_time: currentTime,
        scan_type: scanType,
        status,
        date: currentDate,
      };
      
      const docId = await createDocument('attendance_logs', attendanceData);

      // Send notification if there's an irregularity
      if (scanType === 'in' && ['late', 'absent'].includes(status)) {
        await NotificationService.sendAttendanceIrregularity({
          teacherId: selectedTeacher,
          teacherName: teacher.name,
          className: classroom.name,
          classTime: schedule.start_time,
          status: status as 'late' | 'absent',
          date: currentDate
        });
      } else if (scanType === 'out' && status === 'early_leave') {
        await NotificationService.sendAttendanceIrregularity({
          teacherId: selectedTeacher,
          teacherName: teacher.name,
          className: classroom.name,
          classTime: schedule.start_time,
          status: 'early_leave',
          date: currentDate
        });
      }

      setLastScan({
        id: docId,
        ...attendanceData,
        teacher,
        classroom,
      });

      // Reset selections
      setSelectedTeacher('');
      setSelectedClassroom('');
    } catch (error) {
      console.error('Error recording attendance:', error);
      alert('Error recording attendance. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              RFID Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rfid">Scan RFID Card</Label>
              <div className="flex gap-2">
                <Input
                  id="rfid"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  placeholder="Tap RFID card here"
                  autoFocus
                />
                <Button onClick={handleRFIDScan} disabled={!rfidInput.trim()}>
                  Scan
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="teacher">Teacher</Label>
              <Select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.rfid_id})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="classroom">Classroom</Label>
              <Select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
              >
                <option value="">Select classroom</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name} - {classroom.location}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleScan('in')}
                disabled={!selectedTeacher || !selectedClassroom || isScanning}
                className="flex-1"
              >
                {isScanning ? 'Recording...' : 'Scan In'}
              </Button>
              <Button
                onClick={() => handleScan('out')}
                disabled={!selectedTeacher || !selectedClassroom || isScanning}
                variant="outline"
                className="flex-1"
              >
                {isScanning ? 'Recording...' : 'Scan Out'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {lastScan && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Last Scan Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                {getStatusBadge(lastScan.status)}
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{lastScan.teacher?.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {lastScan.classroom?.name} - {lastScan.classroom?.location}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {lastScan.scan_type === 'in' ? 'Scanned In' : 'Scanned Out'} at{' '}
                  {new Date(`2000-01-01T${lastScan.scan_time}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}