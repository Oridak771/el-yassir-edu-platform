import usersData from '../data/users.json';
import notificationsData from '../data/notifications.json';
import classesData from '../data/classes.json';
import gradesData from '../data/grades.json';
import absencesData from '../data/absences.json';
import { User, Notification, Class, Grade, Absence } from './definitions';
import Cookies from 'js-cookie';

// Correctly parse the data from the JSON files
const allUsers: User[] = (usersData as { users: User[] }).users;
const allNotifications: Notification[] = notificationsData as Notification[];
const allClasses: Class[] = (classesData as { classes: Class[] }).classes;
const allGrades: Grade[] = (gradesData as { grades: Grade[] }).grades;
const allAbsences: Absence[] = (absencesData as { absences: Absence[] }).absences;

// User Functions
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

  signOut: async () => {
    Cookies.remove('session_user_id', { path: '/' });
  },
};
