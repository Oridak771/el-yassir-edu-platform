// This file contains type definitions for the data structures used in the application.

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'professor' | 'parent' | 'student' | 'orientation';
  avatar?: string;
  class_id?: string;
  parent_id?: string;
  children_ids?: string[];
  created_at: string;
  // Optional fields based on role
  department?: string; // For professors
  children?: string[]; // For parents
  grade_level?: string; // For students
};

export type Notification = {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
};

export type Class = {
  id: string;
  name: string;
  professor_id: string;
  students: string[];
  schedule: string;
  room: string;
  semester: string;
  max_students: number;
  current_students: number;
};

export type Grade = {
  id: string;
  student_id: string;
  class_id: string;
  grade: number;
  term: string;
  date: string;
  type: string;
  comment: string;
};

export type Absence = {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  submitted_by: string;
  submitted_at: string;
  document_provided: boolean;
};
