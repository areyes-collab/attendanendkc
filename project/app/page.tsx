import Link from 'next/link';
import { Shield, Users, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HomeHeader } from '@/components/layout/home-header';

export default function Home() {
  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        backgroundImage: "url('/ndkcb.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/80 z-0" />
      <div className="relative z-10 min-h-screen flex flex-col">
        <HomeHeader />
        <div className="container mx-auto px-4 py-16 flex-1">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-gray-900">
                Teacher Attendance System
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced RFID-based attendance tracking with real-time monitoring, 
              grace period management, and comprehensive analytics.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Teacher Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Create and manage teacher accounts with RFID registration 
                  and classroom assignments.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
                <CardTitle>Smart Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Automatic status detection with configurable grace periods 
                  for accurate attendance tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-secondary mx-auto mb-4" />
                <CardTitle>Analytics & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Comprehensive reporting with insights on punctuality, 
                  attendance patterns, and performance metrics.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Flow */}
          <Card className="mb-16">
            <CardHeader>
              <CardTitle className="text-2xl text-center">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-semibold">Setup Schedule</h3>
                  <p className="text-sm text-gray-600">
                    Admin creates teacher schedules with grace periods
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-success font-bold">2</span>
                  </div>
                  <h3 className="font-semibold">RFID Scan</h3>
                  <p className="text-sm text-gray-600">
                    Teacher scans RFID at classroom terminal
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-accent font-bold">3</span>
                  </div>
                  <h3 className="font-semibold">Auto Status</h3>
                  <p className="text-sm text-gray-600">
                    System determines: On Time, Late, or Absent
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-secondary font-bold">4</span>
                  </div>
                  <h3 className="font-semibold">Real-time Updates</h3>
                  <p className="text-sm text-gray-600">
                    Instant dashboard updates and analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Examples */}
          <div className="mt-16 text-center">
            <h3 className="text-lg font-semibold mb-4">Attendance Status Examples</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Class starts 8:00 AM, Grace Period = 10 minutes</p>
              <p>✅ Scan at 8:05 AM = <strong>On Time</strong></p>
              <p>⚠️ Scan at 8:12 AM = <strong>Late</strong></p>
              <p>❌ No scan until 8:15 AM = <strong>Absent</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}