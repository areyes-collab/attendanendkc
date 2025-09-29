'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, Lock, Eye, EyeOff } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { authenticateAndDetectRole } from '@/lib/auth';
import { getDocuments, createAuthUser, createDocument } from '@/lib/firebase';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '', // Added for signup
    confirmPassword: '', // Added for signup
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
      // If no admin exists, show signup by default
      if (admins.length === 0) {
        setIsSignUp(true);
      }
    } catch (error) {
      console.error('Error checking admin existence:', error);
    }
  };

  const createAdminAccount = async (email: string, password: string, name: string) => {
    try {
      // Create Firebase Auth user
      const authUid = await createAuthUser(email, password);
      
      // Create admin document in Firestore
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
        // Validate signup fields
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

        // Check again if admin exists (prevent race condition)
        const admins = await getDocuments('admins');
        if (admins.length > 0) {
          showToast.error('An admin account already exists');
          setIsSignUp(false);
          setAdminExists(true);
          return;
        }

        // Create admin account
        await createAdminAccount(formData.email, formData.password, formData.name);
        showToast.success('Admin account created successfully!');
        // Log in automatically
        const user = await authenticateAndDetectRole(formData.email, formData.password);
        if (user) {
          // Store in both localStorage and cookie
          localStorage.setItem('user', JSON.stringify(user));
          document.cookie = `user=${JSON.stringify(user)}; path=/`;
          router.push('/admin');
        }
      } else {
        // Normal login flow
        const user = await authenticateAndDetectRole(formData.email, formData.password);
        if (user) {
          // Store in both localStorage and cookie
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl">Teacher Attendance</CardTitle>
              <p className="text-gray-600">{isSignUp ? 'Create Admin Account' : 'Sign in to your account'}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isSignUp ? 'Create Admin Account' : 'Sign In')}
            </Button>

            {!adminExists && !isSignUp && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => setIsSignUp(true)}
              >
                Create First Admin Account
              </Button>
            )}

            {!adminExists && isSignUp && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => setIsSignUp(false)}
              >
                Back to Login
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}