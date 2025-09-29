'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createDocument, updateDocument } from '@/lib/firebase';

const classroomSchema = z.object({
  name: z.string().min(1, 'Classroom name is required'),
  location: z.string().min(1, 'Location is required'),
  id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

type ClassroomFormData = z.infer<typeof classroomSchema>;

interface ClassroomFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  classroom?: {
    id: string;
    name: string;
    location: string;
  };
  mode?: 'create' | 'edit';
}

export function ClassroomForm({ onSuccess, onCancel, classroom, mode = 'create' }: ClassroomFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
    defaultValues: classroom ? {
      name: classroom.name,
      location: classroom.location,
    } : undefined,
  });

  const onSubmit = async (data: ClassroomFormData) => {
    setIsLoading(true);
    try {
      if (mode === 'edit' && classroom) {
        await updateDocument('classrooms', classroom.id, {
          ...data,
          updated_at: new Date().toISOString(),
        });
      } else {
        await createDocument('classrooms', {
          ...data,
          created_at: new Date().toISOString(),
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving classroom:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Classroom' : 'Add New Classroom'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Classroom Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Room 101, Lab A"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., Building A, 2nd Floor"
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading 
                ? (mode === 'edit' ? 'Saving...' : 'Creating...') 
                : (mode === 'edit' ? 'Save Changes' : 'Create Classroom')}
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