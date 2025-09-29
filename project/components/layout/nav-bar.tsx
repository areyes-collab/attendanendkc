'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Users } from 'lucide-react';

export function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Admin Login', icon: Shield },
    { href: '/teacher', label: 'Teacher Login', icon: Users },
  ];

  return (
    <nav className="bg-[#006400] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center space-x-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-1.5 text-sm font-medium rounded-full border border-white/20 transition-colors hover:bg-green-900 hover:border-white flex items-center gap-2 ${
                pathname === item.href ? 'bg-green-900 border-white' : ''
              }`}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}