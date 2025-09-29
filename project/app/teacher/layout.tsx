'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, createContext, useContext } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/animations/page-transition';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
});

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && user.role !== 'teacher') {
      router.push('/login');
    }
  }, [user, router]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      <div className="flex h-screen">
        <Sidebar 
          userRole="teacher"
          isCollapsed={isCollapsed}
          onToggle={toggleSidebar}
        />
        <AnimatePresence mode="wait">
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </div>
    </SidebarContext.Provider>
  );
}