'use client';

import { useState } from 'react';
import { Bell, User, LogOut, Send, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { NotificationManager } from '@/components/admin/notification-manager';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useRealtimeNotifications } from '@/lib/notification-hooks';
import { type Notification } from '@/lib/notifications';

interface HeaderProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Header({ isCollapsed, onToggle }: HeaderProps = {}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationManager, setShowNotificationManager] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const { notifications } = useRealtimeNotifications(user?.id || '', user?.role || 'teacher');
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const handleLogout = () => {
    signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col">
      {/* Top Header - College Name and Logo */}
      <div className="flex items-center justify-between bg-green-900 px-6 py-3">
        <div className="flex items-center gap-3">
          <img 
            src="/ndkc.png" 
            alt="NDKC Logo" 
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-white">Notre Dame of Kidapawan College</h1>
            <p className="text-sm text-green-200">Excellence and Virtue</p>
          </div>
        </div>
      </div>

      {/* Bottom Header - User Profile */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border-2 border-green-100">
            {user?.profile_image ? (
              <AvatarImage src={user.profile_image} alt={user.name} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-green-600 text-lg font-semibold text-white">
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {user?.name || 'User'}
            </h2>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hover:bg-green-800"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {user?.role === 'admin' && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowNotificationManager(true)}
              title="Send Notifications"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowNotifications(true)}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
          <Link href={`/${user?.role}/profile`}>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <NotificationCenter
        userId={user?.id || ''}
        userRole={user?.role || 'teacher'}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      {showNotificationManager && (
        <NotificationManager
          onClose={() => setShowNotificationManager(false)}
        />
      )}
    </div>
  );
}