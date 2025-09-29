'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleForm } from '@/components/admin/schedule-form';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';
import { subscribeToCollection, deleteDocument, getDocuments } from '@/lib/firebase';
import { formatTime, getDayName } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Schedule {
  id: string;
  teacher_id: string;
  classroom_id: string;
  sc_id: string;
  course_code: string;
  course_description: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
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

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  useEffect(() => {
    let unsubscribeSchedules: () => void;

    const loadInitialData = async () => {
      try {
        // Get initial data
        const [teachersData, classroomsData] = await Promise.all([
          getDocuments('teachers'),
          getDocuments('classrooms')
        ]);
        setTeachers(teachersData);
        setClassrooms(classroomsData);

        // Now subscribe to real-time updates
        unsubscribeSchedules = subscribeToCollection('schedules', (schedules) => {
          // Enrich schedules with teacher and classroom data
          const enrichedSchedules = schedules.map((schedule: Schedule) => {
            const teacher = teachersData.find((t: { id: string }) => t.id === schedule.teacher_id);
            const classroom = classroomsData.find((c: { id: string }) => c.id === schedule.classroom_id);
            
            return {
              ...schedule,
              teacher,
              classroom
            };
          });

          const sortedSchedules = enrichedSchedules.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setSchedules(sortedSchedules);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error loading initial data:', error);
        setIsLoading(false);
      }
    };

    loadInitialData();

    // Cleanup function
    return () => {
      if (unsubscribeSchedules) {
        unsubscribeSchedules();
      }
    };

    return () => {
      if (unsubscribeSchedules) {
        unsubscribeSchedules();
      }
    };
  }, [teachers, classrooms]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await deleteDocument('schedules', id);
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedSchedule(null);
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gray-100">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schedules...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
                <p className="text-gray-600">Manage teacher class schedules and timings</p>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </div>

            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <ScheduleForm
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setSelectedSchedule(null);
                  }}
                  schedule={selectedSchedule ?? undefined}
                  mode={selectedSchedule ? 'edit' : 'create'}
                />
              </div>
            )}

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SC ID</TableHead>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Course Description</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Classroom</TableHead>
                      <TableHead>Day/Time</TableHead>
                      <TableHead>Grace Period</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>{schedule.sc_id}</TableCell>
                        <TableCell className="font-mono">{schedule.course_code}</TableCell>
                        <TableCell>{schedule.course_description}</TableCell>
                        <TableCell>{schedule.teacher?.name || 'Unknown Teacher'}</TableCell>
                        <TableCell>
                          <div>
                            <div>{schedule.classroom?.name || 'Unknown Classroom'}</div>
                            <div className="text-sm text-gray-500">{schedule.classroom?.location}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="mb-1">
                              {getDayName(schedule.day_of_week)}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {schedule.grace_period_minutes}min
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(schedule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {schedules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
                            <p className="text-gray-600 mb-4">Get started by creating your first schedule.</p>
                            <Button onClick={() => setShowForm(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Schedule
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}