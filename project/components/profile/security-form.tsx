'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Shield, History, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { auth, db } from '@/lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, collection, getDocs, query, where, orderBy, limit, deleteDoc } from 'firebase/firestore';

interface LoginActivity {
  timestamp: Date;
  activity: string;
  device: string;
  location: string;
}

export function SecurityForm({ userId }: { userId: string }) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [showLoginHistoryDialog, setShowLoginHistoryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginHistory, setLoginHistory] = useState<LoginActivity[]>([]);
  const { showToast } = useToast();

  // Password change handler
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No user logged in');
      }

      // Reauthenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Update password change timestamp in Firestore
      await updateDoc(doc(db, 'admins', userId), {
        last_password_change: new Date(),
      });

      showToast('Password updated successfully', 'success');
      setShowPasswordDialog(false);
      resetPasswordFields();
    } catch (error: any) {
      console.error('Error changing password:', error);
      showToast(
        error.code === 'auth/wrong-password' 
          ? 'Current password is incorrect' 
          : 'Failed to update password',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2FA Handlers
  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      // Here you would integrate with your preferred 2FA provider
      // For example, using Firebase phone authentication or a third-party 2FA service
      showToast('2FA functionality coming soon!', 'info');
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      showToast('Failed to enable 2FA', 'error');
    } finally {
      setIsLoading(false);
      setShowTwoFactorDialog(false);
    }
  };

  // Login History Handler
  const fetchLoginHistory = async () => {
    setIsLoading(true);
    try {
      const historyRef = collection(db, 'login_history');
      const q = query(
        historyRef,
        where('user_id', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({
        timestamp: doc.data().timestamp.toDate(),
        activity: doc.data().activity,
        device: doc.data().device,
        location: doc.data().location,
      }));
      setLoginHistory(history);
      setShowLoginHistoryDialog(true);
    } catch (error) {
      console.error('Error fetching login history:', error);
      showToast('Failed to fetch login history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Account Deletion Handler
  const handleAccountDeletion = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No user logged in');
      }

      // Reauthenticate user before deletion
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Delete user data from Firestore
      await deleteDoc(doc(db, 'admins', userId));

      // Delete user authentication account
      await user.delete();

      showToast('Account deleted successfully', 'success');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('Failed to delete account', 'error');
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const resetPasswordFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Password Security Section */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">Password Security</h3>
              <p className="text-sm text-yellow-800/80 mb-3">
                Keep your account secure by using a strong password and enabling two-factor authentication.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordDialog(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowTwoFactorDialog(true)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
            </div>

            {/* Login Activity Section */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Login Activity</h3>
              <p className="text-sm text-blue-800/80 mb-3">
                Monitor your account activity and manage active sessions.
              </p>
              <Button 
                variant="outline"
                onClick={fetchLoginHistory}
              >
                <History className="h-4 w-4 mr-2" />
                View Login History
              </Button>
            </div>

            {/* Account Deletion Section */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
              <p className="text-sm text-red-800/80 mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                resetPasswordFields();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Add an extra layer of security to your account by enabling 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Two-factor authentication adds an additional layer of security to your account by requiring a verification code in addition to your password when signing in.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTwoFactorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnable2FA} disabled={isLoading}>
              {isLoading ? 'Enabling...' : 'Enable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog open={showLoginHistoryDialog} onOpenChange={setShowLoginHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Login History</DialogTitle>
            <DialogDescription>
              Recent login activity on your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loginHistory.length > 0 ? (
              <div className="space-y-2">
                {loginHistory.map((activity, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{activity.activity}</p>
                        <p className="text-sm text-gray-600">{activity.device}</p>
                        <p className="text-xs text-gray-500">{activity.location}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {activity.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No login history available</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLoginHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Enter your password to confirm deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                Warning: This will permanently delete your account and all associated data. This includes:
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                <li>Your profile information</li>
                <li>Your attendance records</li>
                <li>Your notification settings</li>
                <li>All associated RFID cards</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-password">Enter your password to confirm</Label>
              <Input
                id="delete-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setCurrentPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleAccountDeletion}
              disabled={isLoading || !currentPassword}
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}