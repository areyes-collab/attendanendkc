'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, Lock, Eye, EyeOff, Mail, UserPlus, LogIn } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { authenticateAndDetectRole } from '@/lib/auth';
import { getDocuments, createAuthUser, createDocument } from '@/lib/firebase';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [adminExists, setAdminExists] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const admins = await getDocuments('admins');
      setAdminExists(admins.length > 0);
      if (admins.length === 0) {
        setIsSignUp(true);
      }
    } catch (error) {
      console.error('Error checking admin existence:', error);
    }
  };

  const createAdminAccount = async (email: string, password: string, name: string) => {
    try {
      const authUid = await createAuthUser(email, password);
      
      await createDocument('admins', {
        name,
        email: email.toLowerCase(),
        auth_uid: authUid,
        role: 'admin',
      });
    } catch (error) {
      console.error('Error creating admin account:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!formData.name.trim()) {
          showToast.error('Please enter your name');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          showToast.error('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          showToast.error('Password must be at least 6 characters long');
          return;
        }

        const admins = await getDocuments('admins');
        if (admins.length > 0) {
          showToast.error('An admin account already exists');
          setIsSignUp(false);
          setAdminExists(true);
          return;
        }

        await createAdminAccount(formData.email, formData.password, formData.name);
        showToast.success('Admin account created successfully!');
        
        const user = await authenticateAndDetectRole(formData.email, formData.password);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          document.cookie = `user=${JSON.stringify(user)}; path=/`;
          router.push('/admin');
        }
      } else {
        const user = await authenticateAndDetectRole(formData.email, formData.password);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          document.cookie = `user=${JSON.stringify(user)}; path=/`;
          showToast.success(`Welcome back, ${user.name}!`);
          router.push(`/${user.role}`);
        } else {
          showToast.error('Invalid credentials. Please try again.');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      showToast.error(isSignUp ? 'Failed to create account' : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card variant="elevated" className="overflow-hidden">
          {/* Header */}
          <CardHeader className="text-center bg-gradient-to-r from-green-600 to-blue-600 text-white relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <motion.div 
                className="flex items-center justify-center gap-3 mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Shield className="h-8 w-8" />
                </div>
              </motion.div>
              
              <CardTitle className="text-2xl font-bold mb-2">
                Teacher Attendance System
              </CardTitle>
              
              <AnimatePresence mode="wait">
                <motion.p 
                  key={isSignUp ? 'signup' : 'signin'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-green-100"
                >
                  {isSignUp ? 'Create your admin account' : 'Sign in to continue'}
                </motion.p>
              </AnimatePresence>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="form-group">
                      <Label htmlFor="name" className="form-label">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="pl-11"
                          variant="modern"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="form-group">
                <Label htmlFor="email" className="form-label">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="pl-11"
                    variant="modern"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="password" className="form-label">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="pl-11 pr-11"
                    variant="modern"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="form-group">
                      <Label htmlFor="confirmPassword" className="form-label">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="pl-11"
                          variant="modern"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold shadow-lg" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Please wait...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                      {isSignUp ? 'Create Admin Account' : 'Sign In'}
                    </div>
                  )}
                </Button>
              </motion.div>

              {/* Toggle between login/signup */}
              <AnimatePresence>
                {!adminExists && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setIsSignUp(!isSignUp)}
                    >
                      {isSignUp ? 'Already have an account? Sign in' : 'Create first admin account'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-gray-500">
            © 2024 Notre Dame of Kidapawan College
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Secure attendance management system
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}