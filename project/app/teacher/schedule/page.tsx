'use client';

import { useEffect, useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { subscribeToCollection } from '@/lib/firebase';
import { formatTime, getDayName } from '@/lib/utils';
import { where } from 'firebase/firestore';
import { SidebarContext } from '../layout';

import { getCurrentUser } from '@/lib/auth';
import { NotificationService } from '@/lib/notification-service.new';

export default function TeacherSchedulePage() {
  const user = getCurrentUser();
  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to classrooms
    const unsubscribeClassrooms = subscribeToCollection('classrooms', (data) => {
      setClassrooms(data);
    });

    // Notify admin when teacher views their schedule
    if (user?.role === 'teacher') {
      NotificationService.sendTeacherActionNotification({
        teacherId: user.id,
        teacherName: user.name,
        action: 'Viewed Schedule',
        details: 'Teacher accessed their class schedule',
        timestamp: new Date().toISOString()
      }).catch((error: Error) => console.error('Failed to send notification:', error));
    }

    // Subscribe to teacher's schedules
    const unsubscribeSchedules = subscribeToCollection(
      'schedules',
      (data) => {
        // Enrich schedules with classroom data
        const enrichedSchedules = data.map((schedule: any) => {
          const classroom = classrooms.find(c => c.id === schedule.classroom_id);
          return {
            ...schedule,
            classroom
          };
        });

        // Sort by day of week and start time
        const sortedSchedules = enrichedSchedules.sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) {
            return a.day_of_week - b.day_of_week;
          }
          return a.start_time.localeCompare(b.start_time);
        });

        setSchedules(sortedSchedules);
        setIsLoading(false);
      },
      user?.id ? [where('teacher_id', '==', user.id)] : []
    );

    return () => {
      unsubscribeClassrooms();
      unsubscribeSchedules();
    };
  }, [classrooms]);

  const getSchedulesByDay = () => {
    const schedulesByDay: Record<number, any[]> = {};
    schedules.forEach(schedule => {
      const day = schedule.day_of_week;
      if (!schedulesByDay[day]) {
        schedulesByDay[day] = [];
      }
      schedulesByDay[day].push(schedule);
    });
    return schedulesByDay;
  };

  const getCurrentDaySchedules = () => {
    const today = new Date().getDay();
    return schedules.filter(schedule => schedule.day_of_week === today);
  };

    const schedulesByDay = getSchedulesByDay();
  const todaySchedules = getCurrentDaySchedules();

  if (isLoading) {
    return (
      <div className="h-full bg-gray-100">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title="My Schedule"
          subtitle="View your weekly class schedule and timings"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Today's Schedule Highlight */}
            {todaySchedules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Classes ({getDayName(new Date().getDay())})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {todaySchedules.map((schedule) => (
                      <div key={schedule.id} className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{schedule.classroom?.name}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {schedule.classroom?.location}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              Grace: {schedule.grace_period_minutes}min
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Schedule Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Day</TableHead>
                        <TableHead>Classroom</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="w-[120px]">Time</TableHead>
                        <TableHead className="w-[80px]">Duration</TableHead>
                        <TableHead className="w-[100px]">Grace Period</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[0, 1, 2, 3, 4, 5, 6].map((dayNumber) => {
                        const daySchedules = schedulesByDay[dayNumber] || [];
                        const isToday = dayNumber === new Date().getDay();
                        
                        if (daySchedules.length === 0) {
                          return (
                            <TableRow key={dayNumber} className={isToday ? "bg-primary/5" : ""}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {getDayName(dayNumber)}
                                  {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                                </div>
                              </TableCell>
                              <TableCell colSpan={5} className="text-gray-500 italic">
                                No classes scheduled
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        return daySchedules.map((schedule: any, index: number) => (
                          <TableRow key={`${dayNumber}-${schedule.id}`} className={isToday ? "bg-primary/5" : ""}>
                            {index === 0 && (
                              <TableCell rowSpan={daySchedules.length} className="font-medium">
                                <div className="flex items-center gap-2">
                                  {getDayName(dayNumber)}
                                  {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="font-medium">
                              {schedule.classroom?.name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {schedule.classroom?.location || 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {(() => {
                                const start = new Date(`2000-01-01T${schedule.start_time}`);
                                const end = new Date(`2000-01-01T${schedule.end_time}`);
                                const diffMs = end.getTime() - start.getTime();
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                return `${diffHours}h ${diffMinutes}m`;
                              })()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {schedule.grace_period_minutes}min
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ));
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}