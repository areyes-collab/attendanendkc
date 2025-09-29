'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { updateDocument } from '@/lib/firebase';
import { showToast } from '@/components/ui/toast';
import { createNotification, NotificationTemplates } from '@/lib/notifications';
import { NotificationService } from '@/lib/notification-service.new';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    bio?: string;
    profile_image?: string;
    role: 'admin' | 'teacher';
  };
  onSuccess: () => void;
}

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState(user.profile_image || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    const uploadToast = showToast.loading('Uploading image...');

    try {
      const imageUrl = await uploadToCloudinary(file);
      setProfileImage(imageUrl);
      showToast.dismiss(uploadToast);
      showToast.success('Image uploaded successfully');
    } catch (error) {
      showToast.dismiss(uploadToast);
      showToast.error('Failed to upload image');
      console.error('Image upload error:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setProfileImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    const saveToast = showToast.loading('Updating profile...');

    try {
      const updateData = {
        ...data,
        profile_image: profileImage,
        updated_at: new Date().toISOString(),
      };

      // Update user profile in the appropriate collection
      const collection = user.role === 'admin' ? 'admins' : 'teachers';
      await updateDocument(collection, user.id, updateData);

      // Create notification for the user
      await createNotification({
        user_id: user.id,
        user_role: user.role,
        ...NotificationTemplates.profileUpdated(),
      });

      // If it's a teacher, notify admins about the profile update
      if (user.role === 'teacher') {
        await NotificationService.sendTeacherActionNotification({
          teacherId: user.id,
          teacherName: data.name,
          action: 'Updated Profile',
          details: `Updated their profile information`,
          timestamp: new Date().toISOString()
        });
      }

      showToast.dismiss(saveToast);
      showToast.success('Profile updated successfully');
      onSuccess();
    } catch (error) {
      showToast.dismiss(saveToast);
      showToast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileImage} alt={user.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              
              {profileImage && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isUploadingImage ? 'Uploading...' : 'Change Photo'}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <textarea
                id="bio"
                {...register('bio')}
                placeholder="Tell us about yourself..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
              />
              {errors.bio && (
                <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading || isUploadingImage} className="flex-1">
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}