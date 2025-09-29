import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Users, Clock, BarChart3, ArrowRight, CheckCircle, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <img 
                  src="/ndkc.png" 
                  alt="NDKC Logo" 
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">NDKC</h1>
                  <p className="text-xs text-gray-600">Excellence & Virtue</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
                <Link href="/teacher">
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Teacher
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-4 mb-8"
            >
              <div className="p-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl shadow-xl">
                <Shield className="h-12 w-12 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
                  Teacher Attendance
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Smart RFID System
                </p>
              </div>
            </motion.div>
            
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Advanced RFID-based attendance tracking with real-time monitoring, 
              intelligent grace period management, and comprehensive analytics for educational institutions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex items-center justify-center gap-4 mt-8"
            >
              <Badge variant="success" size="lg" className="px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                Real-time Tracking
              </Badge>
              <Badge variant="info" size="lg" className="px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                Instant Analytics
              </Badge>
              <Badge variant="warning" size="lg" className="px-4 py-2">
                <Globe className="h-4 w-4 mr-2" />
                Cloud-based
              </Badge>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card variant="elevated" className="text-center h-full">
                <CardHeader>
                  <div className="p-4 bg-primary-100 rounded-xl w-fit mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                  <CardTitle className="text-xl">Teacher Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Comprehensive teacher profile management with RFID card registration, 
                    department assignments, and role-based access control.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card variant="elevated" className="text-center h-full">
                <CardHeader>
                  <div className="p-4 bg-accent-100 rounded-xl w-fit mx-auto mb-4">
                    <Clock className="h-8 w-8 text-accent-600" />
                  </div>
                  <CardTitle className="text-xl">Smart Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Intelligent status detection with configurable grace periods, 
                    automatic absence marking, and real-time attendance validation.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card variant="elevated" className="text-center h-full">
                <CardHeader>
                  <div className="p-4 bg-secondary-100 rounded-xl w-fit mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-secondary-600" />
                  </div>
                  <CardTitle className="text-xl">Analytics & Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Comprehensive reporting dashboard with insights on punctuality patterns, 
                    attendance trends, and exportable performance metrics.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Card variant="elevated" className="mb-16 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="text-2xl text-center">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-4 gap-8">
                  {[
                    {
                      step: 1,
                      title: 'Setup Schedule',
                      description: 'Admin creates teacher schedules with customizable grace periods',
                      color: 'primary'
                    },
                    {
                      step: 2,
                      title: 'RFID Scan',
                      description: 'Teacher scans RFID card at classroom terminal',
                      color: 'success'
                    },
                    {
                      step: 3,
                      title: 'Auto Status',
                      description: 'System intelligently determines: On Time, Late, or Absent',
                      color: 'accent'
                    },
                    {
                      step: 4,
                      title: 'Real-time Updates',
                      description: 'Instant dashboard updates and comprehensive analytics',
                      color: 'secondary'
                    }
                  ].map((item, index) => (
                    <motion.div 
                      key={item.step}
                      className="text-center relative"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                    >
                      <div className={`w-16 h-16 bg-${item.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <span className={`text-${item.color}-600 text-2xl font-bold`}>{item.step}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                      
                      {index < 3 && (
                        <ArrowRight className="hidden md:block absolute top-8 -right-4 h-6 w-6 text-gray-300" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Examples */}
          <motion.div 
            className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-soft border border-gray-200"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Attendance Status Examples</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 bg-success-50 rounded-xl border border-success-200">
                <div className="font-semibold text-success-800 mb-2">✅ On Time</div>
                <p className="text-success-700">Class: 8:00 AM, Grace: 10 min</p>
                <p className="text-success-600">Scan: 8:05 AM = On Time</p>
              </div>
              <div className="p-4 bg-warning-50 rounded-xl border border-warning-200">
                <div className="font-semibold text-warning-800 mb-2">⚠️ Late</div>
                <p className="text-warning-700">Class: 8:00 AM, Grace: 10 min</p>
                <p className="text-warning-600">Scan: 8:12 AM = Late</p>
              </div>
              <div className="p-4 bg-destructive-50 rounded-xl border border-destructive-200">
                <div className="font-semibold text-destructive-800 mb-2">❌ Absent</div>
                <p className="text-destructive-700">Class: 8:00 AM, Grace: 10 min</p>
                <p className="text-destructive-600">No scan by 8:15 AM = Absent</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}