"use client";

import { useUser } from '@/hooks/useUser';
import { NotificationPreferencesComponent } from '@/components/notifications/notification-preferences';
import { PageHeader } from '@/components/layout/page-header';

export default function TeacherSettingsPage() {
  const { user } = useUser();

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <PageHeader
        title="Settings"
        subtitle="Manage your notification preferences"
      />
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start">
        <div className="w-full max-w-2xl">
          {user?.id && (
            <NotificationPreferencesComponent userId={user.id} />
          )}
        </div>
      </main>
    </div>
  );
}
