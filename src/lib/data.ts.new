// filepath: c:\Users\Oridak\Desktop\lol\ElYassir\el-yassir-edu-platform\src\lib\data.ts
import users from '../data/users.json';
import classes from '../data/classes.json';
import absences from '../data/absences.json';
import grades from '../data/grades.json';
import notifications from '../data/notifications.json';
import { User, Class, Grade, Absence, Notification } from './utils';

// Base data access object with type-safe data fetching
export const getData = {
  // Base data access
  users: () => users.users as User[],
  classes: () => classes.classes as Class[],
  absences: () => absences.absences as Absence[],
  grades: () => grades.grades as Grade[],
  notifications: () => notifications as Notification[],

  // User data access
  getUserById: (id: string) => users.users.find(u => u.id === id) as User | undefined,
  getUsersByRole: (role: User['role']) => users.users.filter(u => u.role === role) as User[],
  getParentChildren: (parentId: string) => {
    const parent = users.users.find(u => u.id === parentId) as User;
    return parent?.children 
      ? users.users.filter(u => parent.children?.includes(u.id)) as User[]
      : [];
  },

  // Class data access
  getClassById: (id: string) => classes.classes.find(c => c.id === id) as Class | undefined,
  getClassesByProfessor: (professorId: string) => 
    classes.classes.filter(c => c.professor_id === professorId) as Class[],
  getStudentClasses: (studentId: string) => 
    classes.classes.filter(c => c.students.includes(studentId)) as Class[],

  // Grade data access
  getStudentGrades: (studentId: string) => 
    grades.grades.filter(g => g.student_id === studentId) as Grade[],
  getClassGrades: (classId: string) => 
    grades.grades.filter(g => g.class_id === classId) as Grade[],
  getRecentGrades: (limit = 5) => 
    [...grades.grades]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit) as Grade[],

  // Absence data access
  getStudentAbsences: (studentId: string) => 
    absences.absences.filter(a => a.student_id === studentId) as Absence[],
  getClassAbsences: (classId: string) => 
    absences.absences.filter(a => a.class_id === classId) as Absence[],
  getPendingAbsences: () => 
    absences.absences.filter(a => a.status === 'pending') as Absence[],

  // Notification data access
  getUserNotifications: (userId: string) => 
    notifications.filter(n => n.user_id === userId) as Notification[],
  getUnreadNotifications: (userId: string) => 
    notifications.filter(n => n.user_id === userId && !n.read) as Notification[],
  getRecentNotifications: (limit = 5) => 
    [...notifications]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit) as Notification[]
};

// Mock authentication service
export const auth = {
  signIn: async (email: string, password: string) => {
    const user = users.users.find(u => u.email === email);
    if (!user) throw new Error('Invalid credentials');
    return { user, session: { access_token: 'mock_token' } };
  },

  getSession: async () => {
    return {
      user: users.users[0],
      session: { access_token: 'mock_token' }
    };
  },

  signOut: async () => true
};
