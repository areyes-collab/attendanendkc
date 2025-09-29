// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection as fsCollection,
  addDoc, 
  getDocs, 
  getDoc, 
  doc as fsDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  query as fsQuery,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import type { QuerySnapshot, DocumentSnapshot, DocumentData } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAD2zI-7kXEMj7VkodUq0uBG6nIpwxCkEY",
  authDomain: "attendace-1ba45.firebaseapp.com",
  projectId: "attendace-1ba45",
  storageBucket: "attendace-1ba45.firebasestorage.app",
  messagingSenderId: "109085096144",
  appId: "1:109085096144:web:7c1ca95df4c0e6481dc6d5"
};

// Initialize Firebase (singleton)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;

// Firestore helper functions
export const queryCollection = async (
  collectionName: string,
  field: string,
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=',
  value: any
): Promise<any[]> => {
  const collectionRef = fsCollection(db, collectionName);
  const q = fsQuery(collectionRef, where(field, operator, value));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
};
export const createDocument = async (collectionName: string, data: any) => {
  const docRef = await addDoc(fsCollection(db, collectionName), {
    ...data,
    created_at: new Date().toISOString(),
  });
  return docRef.id;
};

export const getDocuments = async (
  collectionName: string,
  conditions?: any[]
): Promise<any[]> => {
  const collectionRef = fsCollection(db, collectionName);
  
  if (conditions && conditions.length > 0) {
    let q = fsQuery(collectionRef);
    conditions.forEach(condition => {
      q = fsQuery(q, condition);
    });
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  } else {
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  const docRef = fsDoc(db, collectionName, id);
  await updateDoc(docRef, data);
};

export const deleteDocument = async (collectionName: string, id: string) => {
  const docRef = fsDoc(db, collectionName, id);
  await deleteDoc(docRef);
};

export const deleteAllDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(fsCollection(db, collectionName));
  const batch = writeBatch(db);
  
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};

// Real-time listener for documents
export const subscribeToCollection = (
  collectionName: string, 
  callback: (data: any[]) => void,
  conditions?: any[]
) => {
  const collectionRef = fsCollection(db, collectionName);
  
  let q: any = collectionRef;
  if (conditions && conditions.length > 0) {
    q = fsQuery(collectionRef);
    conditions.forEach(condition => {
      q = fsQuery(q, condition);
    });
  }
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const data = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    callback(data);
  });
};

// Real-time listener for a single document
export const subscribeToDocument = (
  collectionName: string,
  docId: string,
  callback: (data: any) => void
) => {
  const docRef = fsDoc(db, collectionName, docId);
  
  return onSnapshot(docRef, (d: DocumentSnapshot<DocumentData>) => {
    if (d.exists()) {
      callback({ id: d.id, ...d.data() });
    } else {
      callback(null);
    }
  });
};

// Admin: create Firebase Auth user using an isolated secondary app to avoid altering the current session
export const createAuthUser = async (email: string, password: string): Promise<string> => {
  // Reuse or create a named secondary app instance
  const secondaryAppName = 'SecondaryAuthApp';
  let secondaryApp;
  try {
    secondaryApp = getApps().find(a => a.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
  } catch {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);

  // Ensure secondary auth session is cleared
  try { await signOut(secondaryAuth); } catch {}

  return cred.user.uid;
};

// Firebase database structure types
export interface Teacher {
  id: string;
  name: string;
  email: string;
  rfid_id: string;
  created_at: string;
}

export interface Classroom {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  teacher_id: string;
  classroom_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  created_at: string;
}

export interface AttendanceLog {
  id: string;
  teacher_id: string;
  classroom_id: string;
  schedule_id: string;
  scan_time: string;
  scan_type: 'in' | 'out';
  status: 'on_time' | 'late' | 'absent' | 'early_leave';
  date: string;
  created_at: string;
}