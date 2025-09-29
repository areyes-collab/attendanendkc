'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { ProfileDropdown } from './profile-dropdown';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs, 
  onToggleSidebar, 
  isSidebarCollapsed 
}: PageHeaderProps) {
  const { user } = useUser();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        {/* Top Bar with User Profile */}
        <div className="flex items-center justify-between mb-4">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hover:bg-green-50"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </Button>

          {/* User Profile */}
          <ProfileDropdown user={user} />
        </div>

        {/* Header Content */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Right-side buttons can be passed as children if needed */}
            <Button variant="outline">
              Export
            </Button>
            <Button>
              Print Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}