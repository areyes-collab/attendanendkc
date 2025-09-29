'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/teachers', label: 'Teachers' },
    { href: '/admin/attendance', label: 'Attendance' },
    { href: '/admin/schedules', label: 'Schedules' },
    { href: '/admin/reports', label: 'Reports' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6">
        <div className="flex items-center space-x-4 h-14">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === item.href
                  ? 'bg-green-100 text-green-900'
                  : 'text-gray-600 hover:text-green-900 hover:bg-green-50'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}