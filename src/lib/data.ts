import usersData from '../data/users.json';
import notificationsData from '../data/notifications.json';
import classesData from '../data/classes.json';
import gradesData from '../data/grades.json';
import absencesData from '../data/absences.json';
import { User, Notification, Class, Grade, Absence } from './definitions';
import Cookies from 'js-cookie';

// Helper function to safely extract array data from JSON imports
const extractData = <T>(data: any, key: string): T[] => {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && typeof data === 'object' && key in data && Array.isArray(data[key])) {
    return data[key] as T[];
  }
  return []; // Return empty array as a fallback to prevent crashes
};

// Correctly parse the data from the JSON files
const allUsers: User[] = extractData<User>(usersData, 'users');
const allNotifications: Notification[] = extractData<Notification>(notificationsData, 'notifications');
const allClasses: Class[] = extractData<Class>(classesData, 'classes');
const allGrades: Grade[] = extractData<Grade>(gradesData, 'grades');
const allAbsences: Absence[] = extractData<Absence>(absencesData, 'absences');

// User Functions
export function getUsers(): User[] {
  return allUsers;
}

export function getUsersByRole(role: string): User[] {
  return allUsers.filter((user) => user.role === role);
}

export function getUserById(id: string): User | null {
  const user = allUsers.find((user) => user.id === id);
  return user || null;
}

// Notification Functions
export function getUserNotifications(userId: string): Notification[] {
  return allNotifications.filter((n) => n.user_id === userId);
}

// Class Functions
export function getClassesByProfessor(professorId: string): Class[] {
  return allClasses.filter((c) => c.professor_id === professorId);
}

export function getClassById(id: string): Class | null {
  const classData = allClasses.find((c) => c.id === id);
  return classData || null;
}

export function getClasses(): Class[] {
  return allClasses;
}

// Grade Functions
export function getGrades(): Grade[] {
  return allGrades;
}

// Absence Functions
export function getAbsences(): Absence[] {
  return allAbsences;
}

// Auth Service
export const auth = {
  signIn: async (email: string, password: string, role: string) => {
    const user = allUsers.find(
      (u) => u.email === email && u.password === password && u.role === role
    );

    if (!user) {
      throw new Error('Invalid credentials or role mismatch');
    }

    Cookies.set('session_user_id', user.id, { expires: 7, path: '/' });

    return { user };
  },

  getSession: async () => {
    const userId = Cookies.get('session_user_id');
    if (!userId) {
      return { user: null };
    }
    const user = getUserById(userId);
    return { user };
  },

  signOut: async () => {
    Cookies.remove('session_user_id', { path: '/' });
  },
};
