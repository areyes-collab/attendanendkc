import { getDocuments, auth } from './firebase';
import { where } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
  rfid_id?: string;
  profile_image?: string;
}

export const authenticateUser = async (
  email: string,
  password: string,
  role: 'admin' | 'teacher'
): Promise<User | null> => {
  try {
    const normalizedEmail = email.toLowerCase();
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const collection = role === 'admin' ? 'admins' : 'teachers';
    const users = await getDocuments(collection, [where('email', '==', normalizedEmail)]);
    
    if (users.length > 0) {
      const u = users[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role,
        rfid_id: u.rfid_id,
        profile_image: u.profile_image,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

// Sign in with Firebase Auth and detect role based on Firestore profile
export const authenticateAndDetectRole = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    const normalizedEmail = email.toLowerCase();
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);

    // Prefer admin profile if exists
    const [adminsByEmail, teachersByEmail] = await Promise.all([
      getDocuments('admins', [where('email', '==', normalizedEmail)]),
      getDocuments('teachers', [where('email', '==', normalizedEmail)])
    ]);

    if (adminsByEmail.length > 0) {
      const a = adminsByEmail[0];
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        role: 'admin',
        profile_image: a.profile_image,
      };
    }

    if (teachersByEmail.length > 0) {
      const t = teachersByEmail[0];
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        role: 'teacher',
        rfid_id: t.rfid_id,
        profile_image: t.profile_image,
      };
    }

    // Fallback: look up by auth_uid linkage
    const [adminsByUid, teachersByUid] = await Promise.all([
      getDocuments('admins', [where('auth_uid', '==', cred.user.uid)]),
      getDocuments('teachers', [where('auth_uid', '==', cred.user.uid)])
    ]);

    if (adminsByUid.length > 0) {
      const a = adminsByUid[0];
      return {
        id: a.id,
        name: a.name,
        email: a.email ?? normalizedEmail,
        role: 'admin',
        profile_image: a.profile_image,
      };
    }

    if (teachersByUid.length > 0) {
      const t = teachersByUid[0];
      return {
        id: t.id,
        name: t.name,
        email: t.email ?? normalizedEmail,
        role: 'teacher',
        rfid_id: t.rfid_id,
        profile_image: t.profile_image,
      };
    }

    // No profile found, default to minimal
    return {
      id: cred.user.uid,
      name: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      role: 'teacher',
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User | null) => {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }
};

export const signOut = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    window.location.href = 'http://localhost:3000';
  }
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};