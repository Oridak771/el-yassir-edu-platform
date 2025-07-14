import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getAbsences, getClasses, getGrades, getUserById } from './data';
import type { Absence, Class, Grade, User } from './definitions';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

export const getUserName = (userId: string): string => {
  const user = getUserById(userId);
  return user?.name || 'Unknown User';
};

export const getClassInfo = (classId: string): Class | null => {
  const classData = getClasses().find((c: Class) => c.id === classId);
  return classData || null;
};

export const getStudentGrades = (studentId: string): Grade[] => {
  return getGrades().filter((g: Grade) => g.student_id === studentId);
};

export const getProfessorClasses = (professorId: string): Class[] => {
  return getClasses().filter((c: Class) => c.professor_id === professorId);
};

export const getStudentAbsences = (studentId: string): Absence[] => {
  return getAbsences().filter((a: Absence) => a.student_id === studentId);
};
