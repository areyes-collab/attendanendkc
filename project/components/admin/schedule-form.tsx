'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocuments, createDocument, updateDocument } from '@/lib/firebase';
import { getDayName } from '@/lib/utils';
import { NotificationService } from '@/lib/notification-service.new';

const scheduleSchema = z.object({
  teacher_id: z.string().min(1, 'Teacher is required'),
  classroom_id: z.string().min(1, 'Classroom is required'),
  sc_id: z.string().min(1, 'SC ID is required'),
  course_code: z.string()
    .min(1, 'Course Code is required')
    .regex(/^[A-Z]{2,4}[0-9]{3}$/, 'Course Code must be in format: CS101, MATH201, etc.'),
  course_description: z.string().min(1, 'Course Description is required'),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  grace_period_minutes: z.number().min(0).max(60),
  id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface ScheduleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  schedule?: {
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
  };
  mode?: 'create' | 'edit';
}

export function ScheduleForm({ onSuccess, onCancel, schedule, mode = 'create' }: ScheduleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: schedule ? {
      teacher_id: schedule.teacher_id,
      classroom_id: schedule.classroom_id,
      sc_id: schedule.sc_id,
      course_code: schedule.course_code,
      course_description: schedule.course_description,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      grace_period_minutes: schedule.grace_period_minutes,
    } : {
      grace_period_minutes: 10,
    },
  });

  useEffect(() => {
    fetchTeachersAndClassrooms();
  }, []);

  const fetchTeachersAndClassrooms = async () => {
    try {
      const [teachers, classrooms] = await Promise.all([
        getDocuments('teachers'),
        getDocuments('classrooms'),
      ]);

      console.log('Loaded Teachers:', teachers);
      console.log('Loaded Classrooms:', classrooms);

      setTeachers(teachers);
      setClassrooms(classrooms);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onSubmit = async (data: ScheduleFormData) => {
    setIsLoading(true);
    try {
      // Find the teacher details for the notification
      const teacher = teachers.find(t => t.id === data.teacher_id);
      const classroom = classrooms.find(c => c.id === data.classroom_id);
      
      if (mode === 'edit' && schedule) {
        await updateDocument('schedules', schedule.id, {
          ...data,
          updated_at: new Date().toISOString(),
        });
        
        // Send update notification
        if (teacher && classroom) {
          await NotificationService.sendSystemAnnouncement({
            title: 'Schedule Updated',
            message: `Your schedule for ${data.course_code} (${data.course_description}) has been updated. The class will be held in ${classroom.name} on ${getDayName(data.day_of_week)} from ${data.start_time} to ${data.end_time}.`,
            type: 'schedule_change',
            targetRole: 'teacher',
            urgent: true
          });
        }
      } else {
        await createDocument('schedules', {
          ...data,
          created_at: new Date().toISOString(),
        });

        // Send new schedule notification
        if (teacher && classroom) {
          await NotificationService.sendSystemAnnouncement({
            title: 'New Schedule Assigned',
            message: `You have been assigned to teach ${data.course_code} (${data.course_description}) in ${classroom.name} on ${getDayName(data.day_of_week)} from ${data.start_time} to ${data.end_time}.`,
            type: 'schedule_change',
            targetRole: 'teacher',
            urgent: true
          });
        }
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Schedule' : 'Create Schedule'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="teacher_id">Teacher</Label>
            <select
              id="teacher_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('teacher_id')}
            >
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            {errors.teacher_id && (
              <p className="text-sm text-red-600">{errors.teacher_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="classroom_id">Classroom</Label>
            <select
              id="classroom_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('classroom_id')}
            >
              <option value="">Select a classroom</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} - {classroom.location}
                </option>
              ))}
            </select>
            {errors.classroom_id && (
              <p className="text-sm text-red-600">{errors.classroom_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="sc_id">SC ID</Label>
            <Input
              id="sc_id"
              {...register('sc_id')}
              placeholder="e.g., SC001"
            />
            {errors.sc_id && (
              <p className="text-sm text-red-600">{errors.sc_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="course_code">Course Code</Label>
            <Input
              id="course_code"
              {...register('course_code')}
              placeholder="e.g., CS101"
              className="font-mono"
            />
            {errors.course_code && (
              <p className="text-sm text-red-600">{errors.course_code.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="course_description">Course Description</Label>
            <Input
              id="course_description"
              {...register('course_description')}
              placeholder="e.g., Introduction to Computer Science"
            />
            {errors.course_description && (
              <p className="text-sm text-red-600">{errors.course_description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="day_of_week">Day of Week</Label>
            <Select
              {...register('day_of_week', { valueAsNumber: true })}
              onChange={(e) => setValue('day_of_week', parseInt(e.target.value))}
            >
              <option value="">Select a day</option>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <option key={day} value={day}>
                  {getDayName(day)}
                </option>
              ))}
            </Select>
            {errors.day_of_week && (
              <p className="text-sm text-red-600">{errors.day_of_week.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time')}
              />
              {errors.start_time && (
                <p className="text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                {...register('end_time')}
              />
              {errors.end_time && (
                <p className="text-sm text-red-600">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="grace_period_minutes">Grace Period (minutes)</Label>
            <Input
              id="grace_period_minutes"
              type="number"
              min="0"
              max="60"
              {...register('grace_period_minutes', { valueAsNumber: true })}
            />
            {errors.grace_period_minutes && (
              <p className="text-sm text-red-600">{errors.grace_period_minutes.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading 
                ? (mode === 'edit' ? 'Saving...' : 'Creating...') 
                : (mode === 'edit' ? 'Save Changes' : 'Create Schedule')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}