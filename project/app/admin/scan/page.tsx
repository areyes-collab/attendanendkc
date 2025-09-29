'use client';

import { useContext } from 'react';
import { EnhancedRFIDScanner } from '@/components/admin/enhanced-rfid-scanner';
import { PageHeader } from '@/components/layout/page-header';
import { SidebarContext } from '../layout';

export default function AdminScanPage() {
  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);
  
  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title="RFID Scanner"
          subtitle="Advanced RFID scanning with room-based scheduling and real-time validation"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            
            <EnhancedRFIDScanner />
          </div>
        </main>
      </div>
    </div>
  );
}