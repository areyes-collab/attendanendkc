'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createDocument, createAuthUser, updateDocument, queryCollection } from '@/lib/firebase';
const baseTeacherSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  rfid_id: z.string().min(1, 'RFID ID is required'),
  teacher_id: z.string()
    .regex(/^\d{4}-\d{3}$/, 'Teacher ID must be in format YYYY-NNN (e.g., 2022-280)')
    .min(8, 'Teacher ID is required'),
});

const createTeacherSchema = baseTeacherSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type CreateTeacherFormData = z.infer<typeof createTeacherSchema>;
type EditTeacherFormData = z.infer<typeof baseTeacherSchema>;

interface TeacherFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  teacher?: {
    id: string;
    name: string;
    email: string;
    rfid_id: string;
  };
  mode?: 'create' | 'edit';
}

export function TeacherForm({ onSuccess, onCancel, teacher, mode = 'create' }: TeacherFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateTeacherFormData | EditTeacherFormData>({
    resolver: zodResolver(mode === 'edit' ? baseTeacherSchema : createTeacherSchema),
    defaultValues: teacher ? {
      name: teacher.name,
      email: teacher.email,
      rfid_id: teacher.rfid_id,
    } : undefined,
  });

  const onSubmit = async (data: CreateTeacherFormData | EditTeacherFormData) => {
    setIsLoading(true);
    try {
      if (mode === 'edit' && teacher) {
        // Update existing teacher
        const nowIso = new Date().toISOString();
        await updateDocument('teachers', teacher.id, {
          ...data,
          updated_at: nowIso,
        });
        
        // Update RFID card if RFID ID changed
        const cards = await queryCollection('rfid_cards', 'teacher_id', '==', teacher.id);
        if (cards.length > 0 && cards[0].rfid_id !== data.rfid_id) {
          await updateDocument('rfid_cards', cards[0].id, {
            rfid_id: data.rfid_id,
            updated_at: nowIso,
          });
        }
      } else {
        // Create new teacher
        const authData = data as CreateTeacherFormData;
        const authUid = await createAuthUser(authData.email, authData.password);

        const { password, ...profile } = authData;
        const teacherId = await createDocument('teachers', { 
          ...profile, 
          auth_uid: authUid,
          created_at: new Date().toISOString(),
        });

        // Create RFID card entry
        const nowIso = new Date().toISOString();
        await createDocument('rfid_cards', {
          rfid_id: profile.rfid_id,
          teacher_id: teacherId,
          status: 'active',
          assigned_date: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving teacher:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add New Teacher</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter teacher's full name"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="teacher_id">Teacher ID</Label>
            <Input
              id="teacher_id"
              {...register('teacher_id')}
              placeholder="Format: YYYY-NNN (e.g., 2022-280)"
            />
            {errors.teacher_id && (
              <p className="text-sm text-red-600">{errors.teacher_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="rfid_id">RFID Card</Label>
            <Input
              id="rfid_id"
              {...register('rfid_id')}
              placeholder="Enter RFID card number"
            />
            {errors.rfid_id && (
              <p className="text-sm text-red-600">{errors.rfid_id.message}</p>
            )}
          </div>

          {mode === 'create' && (
            <div>
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Set initial password"
              />
              {'password' in errors && (
                <p className="text-sm text-red-600">{errors.password?.message}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                mode === 'edit' ? 'Saving...' : 'Creating...'
              ) : (
                mode === 'edit' ? 'Save Changes' : 'Create Teacher'
              )}
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