'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getUsersByRole,
  getClassesByProfessor,
  getUserById,
  getUsers,
  getClassById,
  getGrades,
  getAbsences
} from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';
import { FileText, Users, Calendar, GraduationCap, Clock } from 'lucide-react';

export default function ProfessorClassesPage() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Get current professor
  const professor = getUsersByRole('professor')[0];
  // Get professor's classes
  const myClasses = getClassesByProfessor(professor?.id || '');

  // Get students for selected class
  const enrolledStudents = selectedClass
    ? getUsers().filter(user => 
        getClassById(selectedClass)?.students.includes(user.id)
      )
    : [];

  // Get grades and absences for the selected class or student
  const classGrades = selectedClass
    ? getGrades().filter(g => 
        g.class_id === selectedClass &&
        (!selectedStudent || g.student_id === selectedStudent)
      )
    : [];

  const classAbsences = selectedClass
    ? getAbsences().filter(a => 
        a.class_id === selectedClass &&
        (!selectedStudent || a.student_id === selectedStudent)
      )
    : [];

  const calculateStudentStats = (studentId: string) => {
    const studentGrades = getGrades().filter(g => 
      g.class_id === selectedClass && 
      g.student_id === studentId
    );
    
    const studentAbsences = getAbsences().filter(a => 
      a.class_id === selectedClass && 
      a.student_id === studentId
    );

    const averageGrade = studentGrades.length > 0
      ? studentGrades.reduce((sum, g) => sum + g.grade, 0) / studentGrades.length
      : null;

    return {
      totalGrades: studentGrades.length,
      averageGrade,
      totalAbsences: studentAbsences.length
    };
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Classes & Students</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Class List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>My Assigned Classes</CardTitle>
            <CardDescription>Select a class to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myClasses.map((cls) => (
                <Button
                  key={cls.id}
                  variant={selectedClass === cls.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedClass(cls.id);
                    setSelectedStudent(null);
                  }}
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {cls.name}
                  <span className="ml-auto text-xs">
                    {cls.students.length} students
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Class Details */}
        {selectedClass && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {myClasses.find(c => c.id === selectedClass)?.name}
              </CardTitle>
              <CardDescription>
                {selectedStudent 
                  ? `Viewing student: ${getUserById(selectedStudent)?.name}`
                  : 'Class overview and student list'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="students">
                <TabsList>
                  <TabsTrigger value="students">
                    <Users className="mr-2 h-4 w-4" />
                    Students
                  </TabsTrigger>
                  <TabsTrigger value="grades">
                    <FileText className="mr-2 h-4 w-4" />
                    Grades
                  </TabsTrigger>
                  <TabsTrigger value="absences">
                    <Clock className="mr-2 h-4 w-4" />
                    Absences
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="mt-4">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Average Grade</TableHeaderCell>
                        <TableHeaderCell>Absences</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {enrolledStudents.map((student) => {
                        const stats = calculateStudentStats(student.id);
                        return (
                          <TableRow key={student.id}>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>
                              {stats.averageGrade !== null 
                                ? `${stats.averageGrade.toFixed(1)}/100`
                                : 'No grades'
                              }
                            </TableCell>
                            <TableCell>{stats.totalAbsences}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedStudent(student.id)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="grades" className="mt-4">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Student</TableHeaderCell>
                        <TableHeaderCell>Type</TableHeaderCell>
                        <TableHeaderCell>Grade</TableHeaderCell>
                        <TableHeaderCell>Date</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classGrades.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell>
                            {getUserById(grade.student_id)?.name}
                          </TableCell>
                          <TableCell>{grade.type}</TableCell>
                          <TableCell>{grade.grade}/100</TableCell>
                          <TableCell>
                            {new Date(grade.date).toLocaleDateString('en-GB')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="absences" className="mt-4">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Student</TableHeaderCell>
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Reason</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classAbsences.map((absence) => (
                        <TableRow key={absence.id}>
                          <TableCell>
                            {getUserById(absence.student_id)?.name}
                          </TableCell>
                          <TableCell>
                            {new Date(absence.date).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              absence.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : absence.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {absence.status}
                            </span>
                          </TableCell>
                          <TableCell>{absence.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>

              {selectedStudent && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedStudent(null)}
                >
                  Back to All Students
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}