'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  MapPin, 
  BarChart3, 
  Settings, 
  Clock,
  UserCheck,
  Shield,
  User,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole: 'admin' | 'teacher';
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ userRole, isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const adminNavItems = [
    { href: '/admin', icon: BarChart3, label: 'Dashboard' },
    { href: '/admin/scan', icon: UserCheck, label: 'RFID Scanner' },
    { href: '/admin/cards', icon: Shield, label: 'Card Management' },
    { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { href: '/admin/teachers', icon: Users, label: 'Teachers' },
    { href: '/admin/classrooms', icon: MapPin, label: 'Classrooms' },
    { href: '/admin/schedules', icon: Calendar, label: 'Schedules' },
    { href: '/admin/attendance', icon: UserCheck, label: 'Attendance' },
    { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { href: '/admin/profile', icon: User, label: 'Profile' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const teacherNavItems = [
    { href: '/teacher', icon: Clock, label: 'Dashboard' },
    { href: '/teacher/schedule', icon: Calendar, label: 'My Schedule' },
    { href: '/teacher/attendance', icon: BarChart3, label: 'My Attendance' },
    { href: '/teacher/profile', icon: User, label: 'Profile' },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : teacherNavItems;

  return (
    <div className={`flex h-full ${isCollapsed ? 'w-16' : 'w-64'} flex-col bg-green-900 text-white transition-all duration-300`}>
      <div className={`flex flex-col items-center gap-2 p-6 border-b border-green-800 ${isCollapsed ? 'p-2' : ''}`}>
        {!isCollapsed ? (
          <>
            <img 
              src="/ndkc.png" 
              alt="NDKC Logo" 
              className="h-24 w-24 object-contain"
            />
            <div className="text-center">
              <h1 className="text-xl font-bold">AttendanceTracker</h1>
              <p className="text-sm text-green-300 capitalize">{userRole} Panel</p>
            </div>
          </>
        ) : (
          <Shield className="h-8 w-8 text-green-300" />
        )}
      </div>
      
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-green-700 text-white'
                  : 'text-green-200 hover:bg-green-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}