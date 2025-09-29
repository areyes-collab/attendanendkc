'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Scan, Clock, MapPin, User, CheckCircle, AlertTriangle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateAttendanceStatus, formatTime, getDayName } from '@/lib/utils';
import { NotificationService } from '@/lib/notification-service.new';
import { useToast } from '@/components/ui/use-toast';

// Helper functions for status badges
const getScheduleStatusBadge = (status: TeacherSchedule['status']) => {
  switch (status) {
    case 'current':
      return <Badge variant="success">Current Class</Badge>;
    case 'upcoming':
      return <Badge variant="outline">Upcoming</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const getStatusBadge = (status: ScanRecord['status']) => {
  switch (status) {
    case 'on_time':
      return <Badge variant="success" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        On Time
      </Badge>;
    case 'late':
      return <Badge variant="warning" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Late
      </Badge>;
    case 'early_leave':
      return <Badge variant="warning" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Early Leave
      </Badge>;
    case 'absent':
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Absent
      </Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

interface Teacher {
  id: string;
  name: string;
  rfid_id: string;
  teacher_id: string;  // Added field for teacher ID like 2022-280
  department?: string;
  email?: string;
}

interface Classroom {
  id: string;
  name: string;
  location: string;
  building?: string;
  floor?: number;
}

interface TeacherSchedule {
  id: string;
  teacher_id: string;
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classroom_id: string;
  section: string;
  grace_period_minutes: number;
  teacher?: Teacher;
  classroom?: Classroom;
  status?: 'current' | 'upcoming' | 'completed';
}

interface ScanRecord {
  id: string;
  teacher: Teacher;
  classroom?: Classroom;
  currentSchedule?: TeacherSchedule;
  nextSchedule?: TeacherSchedule;
  timestamp: string;
  scan_type: 'in' | 'out';
  status: 'on_time' | 'late' | 'absent' | 'early_leave';
}

export function EnhancedRFIDScanner() {
  const [rfidInput, setRfidInput] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastScan, setLastScan] = useState<ScanRecord | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [currentSchedules, setCurrentSchedules] = useState<TeacherSchedule[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Handle RFID input changes with auto-scan
  const handleRFIDInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setRfidInput(value);
    
    // Check if it's a complete RFID scan (10 digits)
    if (value.length === 10 && /^\d+$/.test(value)) {
      processRFIDScan(value);
    }
  };

  const fetchData = async () => {
    try {
      console.log('Fetching data from Firebase...');
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      const classroomsSnapshot = await getDocs(collection(db, 'classrooms'));
      const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
      const attendanceSnapshot = await getDocs(collection(db, 'attendance_logs'));
      
      const teachersData = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
      console.log('Teachers data:', JSON.stringify(teachersData, null, 2));
      
      const classroomsData = classroomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
      console.log('Classrooms data:', classroomsData);
      
      const schedulesData = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSchedule));
      console.log('Schedules data:', schedulesData);
      
      const attendanceData = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Attendance data:', attendanceData);
      
      setTeachers(teachersData);
      setClassrooms(classroomsData);
      setSchedules(schedulesData);
      
      // Get recent scans for history
      const recentScans = attendanceData
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((scan: any) => {
          const teacher = teachersData.find(t => t.id === scan.teacher_id);
          const classroom = classroomsData.find(c => c.id === scan.classroom_id);
          return { ...scan, teacher, classroom };
        });
      
      setScanHistory(recentScans);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast("Failed to load scanner data", "error");
    }
  };

  useEffect(() => {
    setIsConnected(true);
    fetchData();
    // Auto-focus RFID input
    if (rfidInputRef.current) {
      rfidInputRef.current.focus();
    }
    
    return () => {
      setIsConnected(false); // Clean up by marking scanner as offline when component unmounts
    };
  }, []);

  const updateCurrentSchedules = () => {
    if (!selectedClassroom) {
      return;
    }

    const today = new Date().getDay();
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    // Get schedules for selected classroom today
    const todaySchedules = schedules
      .filter(schedule => 
        schedule.classroom_id === selectedClassroom && 
        schedule.day_of_week === today
      )
      .map(schedule => {
        const teacher = teachers.find(t => t.id === schedule.teacher_id);
        const classroom = classrooms.find(c => c.id === schedule.classroom_id);
        
        // Determine if this is the current/next class
        const startTime = new Date(`2000-01-01T${schedule.start_time}`);
        const endTime = new Date(`2000-01-01T${schedule.end_time}`);
        const now = new Date(`2000-01-01T${currentTime}`);
        
        let status: TeacherSchedule['status'] = 'upcoming';
        if (now >= startTime && now <= endTime) {
          status = 'current';
        } else if (now > endTime) {
          status = 'completed';
        }
        
        return {
          ...schedule,
          teacher,
          classroom,
          status
        };
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    setCurrentSchedules(todaySchedules);
  };

  useEffect(() => {
    if (selectedClassroom) {
      updateCurrentSchedules();
    }
  }, [selectedClassroom, schedules, teachers]);

  const processRFIDScan = async (rfidValue: string) => {
    console.log('Processing RFID scan:', rfidValue);
    console.log('Selected classroom:', selectedClassroom);
    console.log('Current teachers:', teachers);

    // Validate classroom selection
    if (!selectedClassroom) {
      showToast("Please select a classroom first", "error");
      return;
    }

    // Validate scanner connection
    if (!isConnected) {
      showToast("Scanner is offline. Please check connection.", "error");
      return;
    }

    // Validate RFID format (10 digits)
    if (!rfidValue.match(/^\d{10}$/)) {
      showToast("Invalid RFID number. Please enter exactly 10 digits.", "error");
      return;
    }

    setIsScanning(true);

    try {
      // Find teacher by RFID
      console.log('Looking for teacher with RFID:', rfidValue.trim());
      console.log('Teachers to search:', teachers.map(t => ({ id: t.id, name: t.name, rfid: t.rfid_id })));
      const teacher = teachers.find(t => t.rfid_id === rfidValue.trim());
      console.log('Found teacher:', teacher);
      
      if (!teacher) {
        console.log('No teacher found with this RFID');
        showToast("RFID card not recognized. Please register this card first.", "error");
        setRfidInput('');
        // Play error sound
        try {
          const audio = new Audio('/sounds/error.mp3');
          await audio.play();
        } catch (soundError) {
          console.error('Error playing sound:', soundError);
        }
        return;
      }

      // Find current schedule
      const today = new Date().getDay();
      const currentTime = new Date().toTimeString().slice(0, 5);
      
      const schedule = schedules.find(s => 
        s.teacher_id === teacher.id && 
        s.classroom_id === selectedClassroom && 
        s.day_of_week === today
      );

      if (!schedule) {
        showToast(`${teacher.name} has no scheduled class in this room today.`, "error");
        setRfidInput('');
        return;
      }

      // Check for existing scan and prevent duplicates
      const todayScans = scanHistory.filter(scan => 
        scan.teacher.id === teacher.id && 
        scan.classroom?.id === selectedClassroom &&
        scan.timestamp.startsWith(new Date().toISOString().split('T')[0])
      );

      // Check for duplicate scans within 1 minute
      const lastScanTime = todayScans[0]?.timestamp ? new Date(todayScans[0].timestamp) : null;
      const currentTimestamp = new Date();
      if (lastScanTime && (currentTimestamp.getTime() - lastScanTime.getTime()) < 60000) { // 60000ms = 1 minute
        showToast("Please wait at least 1 minute between scans", "error");
        setRfidInput('');
        return;
      }
        
      let scanType: 'in' | 'out' = 'in';
      if (todayScans.some(scan => scan.scan_type === 'in')) {
        scanType = 'out';
      }

      // Calculate status
      let status: 'on_time' | 'late' | 'absent' | 'early_leave' = 'on_time';
      const startTime = new Date(`2000-01-01T${schedule.start_time}`);
      const endTime = new Date(`2000-01-01T${schedule.end_time}`);
      const currentScheduleTime = new Date(`2000-01-01T${currentTime}`);
      
      if (scanType === 'in') {
        status = calculateAttendanceStatus(
          currentTime,
          schedule.start_time,
          schedule.grace_period_minutes
        );
      } else {
        if (currentScheduleTime < endTime) {
          status = 'early_leave';
        }
      }

      // Record attendance
      const classroom = classrooms.find(c => c.id === selectedClassroom);
      const attendanceData = {
        teacher_id: teacher.id,
        classroom_id: selectedClassroom,
        schedule_id: schedule.id,
        scan_time: currentTime,
        scan_type: scanType,
        status,
        date: new Date().toISOString().split('T')[0],
        created_at: Timestamp.now(),
      };

      // Send notification to admin about the teacher's action
      await NotificationService.sendTeacherActionNotification({
        teacherId: teacher.id,
        teacherName: teacher.name,
        action: scanType === 'in' ? 'Checked In' : 'Checked Out',
        details: `${status} at ${classroom?.name || 'Unknown Room'}`,
        timestamp: currentTime
      });
      
      const docRef = await addDoc(collection(db, 'attendance_logs'), attendanceData);

      const scanResult: ScanRecord = {
        id: docRef.id,
        teacher,
        classroom,
        currentSchedule: schedule,
        scan_type: scanType,
        status,
        timestamp: new Date().toISOString(),
      };

      setLastScan(scanResult);
      setScanHistory(prev => [scanResult, ...prev.slice(0, 4)]);
      
      // Success feedback
      showToast(
        `${teacher.name} ${scanType === 'in' ? 'scanned in' : 'scanned out'} successfully`,
        status === 'on_time' ? 'success' : 'warning'
      );
      
      // Play sound
      try {
        const audio = new Audio(status === 'on_time' ? '/sounds/success.mp3' : '/sounds/error.mp3');
        await audio.play();
      } catch (soundError) {
        console.error('Error playing sound:', soundError);
      }
      
      // Send notification if needed
      if ((scanType === 'in' && status === 'late') || 
          (scanType === 'out' && status === 'early_leave')) {
        await NotificationService.sendAttendanceIrregularity({
          teacherId: teacher.id,
          teacherName: teacher.name,
          className: classroom?.name || 'Unknown Room',
          classTime: formatTime(schedule.start_time),
          status,
          date: attendanceData.date,
        });
      }

      // Clear input and refocus
      setRfidInput('');
      if (rfidInputRef.current) {
        rfidInputRef.current.focus();
      }

    } catch (error) {
      console.error('Error processing RFID scan:', error);
      showToast("Failed to process scan. Please try again.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={`border-l-4 ${isConnected ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Scanner Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">Scanner Offline</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scanner */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                RFID Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="classroom">Select Classroom First</Label>
                <Select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="text-lg"
                >
                  <option value="">Choose classroom...</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name} - {classroom.location}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="rfid">Scan RFID Card</Label>
                <div className="flex gap-2">
                  <Input
                    ref={rfidInputRef}
                    id="rfid"
                    value={rfidInput}
                    onChange={handleRFIDInputChange}
                    maxLength={10}
                    placeholder="Enter or scan 10-digit RFID number..."
                    className="text-lg font-mono tracking-wider"
                    disabled={!selectedClassroom || !isConnected}
                  />
                  <Button 
                    onClick={() => rfidInput.length === 10 && processRFIDScan(rfidInput)} 
                    disabled={rfidInput.length !== 10 || !selectedClassroom || isScanning || !isConnected}
                    size="lg"
                  >
                    {isScanning ? 'Processing...' : 'Scan'}
                  </Button>
                </div>
                {!selectedClassroom && (
                  <p className="text-sm text-amber-600 mt-1">Please select a classroom first</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Schedules for Selected Room */}
          {selectedClassroom && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Today's Schedule - {classrooms.find(c => c.id === selectedClassroom)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentSchedules.length > 0 ? (
                    currentSchedules.map((schedule) => (
                      <div 
                        key={schedule.id} 
                        className={`p-4 rounded-lg border ${
                          schedule.status === 'current' 
                            ? 'bg-green-50 border-green-200' 
                            : schedule.status === 'upcoming'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{schedule.teacher?.name}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Grace Period: {schedule.grace_period_minutes} minutes
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {getScheduleStatusBadge(schedule.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No classes scheduled for this room today
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Last Scan Result */}
          {lastScan && (
            <Card className="border-l-4 border-l-blue-500">
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
                  <span className="text-sm font-medium">{lastScan.teacher?.name}</span>
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
                    {formatTime(new Date(lastScan.timestamp).toTimeString().slice(0, 5))}
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <Badge variant="outline" className="text-xs">
                    Teacher ID: {lastScan.teacher?.teacher_id || 'Not assigned'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Scans */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scanHistory.length > 0 ? (
                  scanHistory.map((scan, index) => (
                    <div key={scan.id || index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{scan.teacher?.name}</p>
                          <p className="text-xs text-gray-600">
                            {scan.classroom?.name} • {scan.scan_type === 'in' ? 'In' : 'Out'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(new Date(scan.timestamp).toTimeString().slice(0, 5))}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(scan.status)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center text-sm py-4">
                    No recent scans
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}