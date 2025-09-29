'use client';

import { useState, useContext } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit3, Camera } from 'lucide-react';
import { SidebarContext } from '../layout';

import { getCurrentUser } from '@/lib/auth';

export default function TeacherProfilePage() {
  const user = getCurrentUser();
  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);
  const [isEditing, setIsEditing] = useState(false);

  const handleProfileUpdate = () => {
    // Refresh data or show success message
    console.log('Profile updated successfully');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title="Profile Settings"
          subtitle="Manage your account settings and preferences"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Profile Header Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10"></div>
              <CardContent className="relative p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Profile Avatar Section */}
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                      {user?.profile_image ? (
                        <AvatarImage src={user.profile_image} alt={user.name} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-3xl font-bold">
                          {user?.name?.charAt(0) || 'T'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-gray-200"
                      onClick={() => setIsEditing(true)}
                    >
                      <Camera className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                          {user?.name || 'Teacher Name'}
                        </h1>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Teacher
                          </Badge>
                          <Badge variant="outline" className="text-gray-600">
                            <User className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Mail className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{user?.email || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Phone className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium text-gray-900">Not provided</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="font-medium text-gray-900">2024</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Form Section */}
            {isEditing && user && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Edit3 className="h-5 w-5 text-green-600" />
                    Edit Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ProfileForm user={user} onSuccess={handleProfileUpdate} />
                </CardContent>
              </Card>
            )}

            {/* Profile Overview Cards */}
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Account Information */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-green-600" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Full Name</span>
                        <span className="font-medium">{user?.name || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Email</span>
                        <span className="font-medium">{user?.email || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Role</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Teacher
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Status</span>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Teaching Information */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Teaching Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">RFID ID</span>
                        <span className="font-medium font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {user?.rfid_id || 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Department</span>
                        <span className="font-medium">Not specified</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Subjects</span>
                        <span className="font-medium">Not specified</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Experience</span>
                        <span className="font-medium">Not specified</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-green-50 hover:border-green-200"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-blue-50 hover:border-blue-200"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-purple-50 hover:border-purple-200"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Security Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}