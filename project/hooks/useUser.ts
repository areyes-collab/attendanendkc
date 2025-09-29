import { useEffect } from 'react';
import { useUserStore } from '@/lib/userStore';
import { getCurrentUser, setCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/auth';

export const useUser = () => {
  const { user, setUser, updateUser } = useUserStore();

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser && !user) {
      setUser(savedUser);
    }
  }, [user, setUser]);

  const updateUserProfile = (updates: Partial<User>) => {
    updateUser(updates);
    const currentUser = getCurrentUser();
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updates });
    }
  };

  return { 
    user,
    setUser,
    updateUserProfile
  };
};