'use client';

import { Button } from '@/components/ui/button';
import { Menu, Bell, Search, Plus } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { ProfileDropdown } from './profile-dropdown';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useRealtimeNotifications } from '@/lib/notification-hooks';
import { useState } from 'react';
import { NotificationCenter } from '@/components/notifications/notification-center';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs, 
  onToggleSidebar, 
  isSidebarCollapsed,
  actions,
  searchPlaceholder,
  onSearch
}: PageHeaderProps) {
  const { user } = useUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications } = useRealtimeNotifications(user?.id || '', user?.role || 'teacher');
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <motion.div 
        className="bg-white border-b border-gray-200 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Top Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="hover:bg-gray-100 rounded-lg transition-colors"
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </Button>

              {/* Breadcrumbs */}
              {breadcrumbs && (
                <nav className="flex items-center space-x-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                      )}
                      {crumb.href ? (
                        <Link 
                          href={crumb.href}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-gray-900 font-medium">{crumb.label}</span>
                      )}
                    </div>
                  ))}
                </nav>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Search */}
              {onSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    variant="search"
                    placeholder={searchPlaceholder || "Search..."}
                    className="pl-10 w-64"
                    onChange={(e) => onSearch(e.target.value)}
                  />
                </div>
              )}

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(true)}
                className="relative hover:bg-gray-100 rounded-lg"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    size="sm"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 animate-pulse"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Actions */}
              {actions}

              {/* Profile */}
              <ProfileDropdown user={user} />
            </div>
          </div>
        </div>

        {/* Header Content */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-gray-600 text-base leading-relaxed">
                  {subtitle}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Notification Center */}
      <NotificationCenter
        userId={user?.id || ''}
        userRole={user?.role || 'teacher'}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}