'use client';

import { useState, useContext } from 'react';
import { ProfileForm } from '@/components/profile/profile-form';
import { SecurityForm } from '@/components/profile/security-form';
import { PageHeader } from '@/components/layout/page-header';
import { SidebarContext } from '../layout';
import { NotificationPreferencesComponent } from '@/components/notifications/notification-preferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Bell, Shield } from 'lucide-react';

import { getCurrentUser } from '@/lib/auth';

export default function AdminProfilePage() {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');

  const handleProfileUpdate = () => {
    // Refresh data or show success message
    console.log('Profile updated successfully');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);

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
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Tab Navigation */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex space-x-1">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'default' : 'ghost'}
                      onClick={() => setActiveTab(tab.id as any)}
                      className="flex items-center gap-2"
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
            </Card>

            {/* Tab Content */}
            {activeTab === 'profile' && user && (
              <ProfileForm user={user} onSuccess={handleProfileUpdate} />
            )}

            {activeTab === 'notifications' && user && (
              <NotificationPreferencesComponent userId={user.id} />
            )}

            {activeTab === 'security' && user && (
              <SecurityForm userId={user.id} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}