import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getData } from './data';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: 'admin' | 'professor' | 'parent' | 'student' | 'orientation';
  name: string;
  created_at: string;
  department?: string;
  children?: string[];
  grade_level?: string;
}

export interface Class {
  id: string;
  name: string;
  professor_id: string;
  students: string[];
  schedule: string;
  room: string;
  semester: string;
  max_students: number;
  current_students: number;
}

export interface Grade {
  id: string;
  student_id: string;
  class_id: string;
  grade: number;
  term: string;
  date: string;
  type: 'Exam' | 'Quiz' | 'Assignment';
  comment?: string;
}

export interface Absence {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  submitted_by: string;
  submitted_at: string;
  document_provided: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  description: string;
  participants: string[];
  status: string;
}

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

export const getUserName = (userId: string): string => {
  const user = getData.getUserById(userId);
  return user?.name || 'Unknown User';
};

export const getClassInfo = (classId: string): Class | null => {
  const classData = getData.classes().find((c: Class) => c.id === classId);
  return classData || null;
};

export const getStudentGrades = (studentId: string): Grade[] => {
  return getData.grades().filter((g: Grade) => g.student_id === studentId);
};

export const getProfessorClasses = (professorId: string): Class[] => {
  return getData.classes().filter((c: Class) => c.professor_id === professorId);
};

export const getStudentAbsences = (studentId: string): Absence[] => {
  return getData.absences().filter((a: Absence) => a.student_id === studentId);
};
