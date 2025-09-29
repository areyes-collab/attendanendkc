'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, MapPin, ChartBar as BarChart3, Settings, Clock, UserCheck, Shield, User, Bell, CreditCard, Scan, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  userRole: 'admin' | 'teacher';
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ userRole, isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const adminNavItems = [
    { 
      href: '/admin', 
      icon: BarChart3, 
      label: 'Dashboard',
      description: 'Overview & Analytics',
      badge: null
    },
    { 
      href: '/admin/scan', 
      icon: Scan, 
      label: 'RFID Scanner',
      description: 'Real-time Scanning',
      badge: 'Live'
    },
    { 
      href: '/admin/teachers', 
      icon: Users, 
      label: 'Teachers',
      description: 'Manage Staff',
      badge: null
    },
    { 
      href: '/admin/classrooms', 
      icon: MapPin, 
      label: 'Classrooms',
      description: 'Room Management',
      badge: null
    },
    { 
      href: '/admin/schedules', 
      icon: Calendar, 
      label: 'Schedules',
      description: 'Class Timetables',
      badge: null
    },
    { 
      href: '/admin/attendance', 
      icon: UserCheck, 
      label: 'Attendance',
      description: 'Track Records',
      badge: null
    },
    { 
      href: '/admin/cards', 
      icon: CreditCard, 
      label: 'Card Management',
      description: 'RFID Cards',
      badge: null
    },
    { 
      href: '/admin/notifications', 
      icon: Bell, 
      label: 'Notifications',
      description: 'Message Center',
      badge: null
    },
    { 
      href: '/admin/reports', 
      icon: FileText, 
      label: 'Reports',
      description: 'Analytics & Export',
      badge: null
    },
    { 
      href: '/admin/settings', 
      icon: Settings, 
      label: 'Settings',
      description: 'System Config',
      badge: null
    },
  ];

  const teacherNavItems = [
    { 
      href: '/teacher', 
      icon: Clock, 
      label: 'Dashboard',
      description: 'Today\'s Overview',
      badge: null
    },
    { 
      href: '/teacher/schedule', 
      icon: Calendar, 
      label: 'My Schedule',
      description: 'Class Timetable',
      badge: null
    },
    { 
      href: '/teacher/attendance', 
      icon: BarChart3, 
      label: 'My Attendance',
      description: 'Performance Stats',
      badge: null
    },
    { 
      href: '/teacher/profile', 
      icon: User, 
      label: 'Profile',
      description: 'Account Settings',
      badge: null
    },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : teacherNavItems;

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' }
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -10 }
  };

  return (
    <motion.div 
      className="flex h-full flex-col bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white shadow-2xl border-r border-green-700"
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className={cn(
        'flex flex-col items-center gap-3 p-6 border-b border-green-700/50',
        isCollapsed && 'p-4'
      )}>
        <div className="relative">
          <img 
            src="/ndkc.png" 
            alt="NDKC Logo" 
            className={cn(
              'object-contain transition-all duration-300',
              isCollapsed ? 'h-12 w-12' : 'h-16 w-16'
            )}
          />
          <div className="absolute -inset-1 bg-white/20 rounded-full blur opacity-30"></div>
        </div>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <h1 className="text-lg font-bold text-white">AttendanceTracker</h1>
              <p className="text-xs text-green-200 capitalize font-medium tracking-wide">
                {userRole} Panel
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4 overflow-y-auto scrollbar-hide">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:scale-105',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-green-200 hover:bg-white/10 hover:text-white'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className={cn(
                  'flex items-center justify-center rounded-lg p-2 transition-colors',
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'text-green-300 group-hover:bg-white/10 group-hover:text-white'
                )}>
                  <item.icon className="h-5 w-5" />
                </div>

                {/* Label and Description */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      variants={itemVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{item.label}</p>
                          <p className="text-xs text-green-200 truncate">{item.description}</p>
                        </div>
                        
                        {/* Badge */}
                        {item.badge && (
                          <Badge 
                            variant="outline" 
                            size="sm"
                            className="ml-2 border-white/30 text-white bg-white/10"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        
                        {/* Arrow for active item */}
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-white/80 ml-2" />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs text-gray-300">{item.description}</div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-green-700/50 p-4',
        isCollapsed && 'p-2'
      )}>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-xs text-green-200">
                © 2024 NDKC
              </p>
              <p className="text-xs text-green-300 font-medium">
                v2.0.0
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}