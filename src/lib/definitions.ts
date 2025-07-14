// This file contains type definitions for the data structures used in the application.

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
