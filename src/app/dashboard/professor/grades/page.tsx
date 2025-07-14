'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getUsersByRole, getClassesByProfessor, getClassById, getUserById, getGrades } from '@/lib/data';
import { Download, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type GradeType = 'Exam' | 'Quiz' | 'Assignment';

type StudentGradeEntry = {
  student_id: string;
  student_name: string;
  score?: number | string;
  grade_id?: string;
};

export default function ProfessorGradesPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedGradeType, setSelectedGradeType] = useState<GradeType>('Exam');
  const [studentGrades, setStudentGrades] = useState<StudentGradeEntry[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current professor
  const professor = getUsersByRole('professor')[0];
  
  // Get professor's classes
  const myClasses = getClassesByProfessor(professor?.id || '');

  const loadStudentGrades = useCallback(() => {
    // Get all students in the selected class
    const classData = getClassById(selectedClassId);
    if (classData) {
      const students = classData.students.map(studentId => {
        const student = getUserById(studentId);
        const existingGrade = getGrades().find((g: any) => 
          g.student_id === studentId && 
          g.class_id === selectedClassId && 
          g.type === selectedGradeType
        );
        return {
          student_id: studentId,
          student_name: student?.name || 'Unknown Student',
          score: existingGrade?.grade || '',
          grade_id: existingGrade?.id
        };
      });
      setStudentGrades(students);
    }
  }, [selectedClassId, selectedGradeType]);

  useEffect(() => {
    if (selectedClassId) {
      loadStudentGrades();
    }
  }, [selectedClassId, selectedGradeType, loadStudentGrades]);

  const handleScoreChange = (studentId: string, value: string) => {
    setStudentGrades(prev => 
      prev.map(entry => 
        entry.student_id === studentId 
          ? { ...entry, score: value }
          : entry
      )
    );
  };

  const handleSubmit = async () => {
    setError(null);
    
    // Validate grades
    const invalidGrades = studentGrades.filter(
      entry => entry.score !== '' && (isNaN(Number(entry.score)) || Number(entry.score) < 0 || Number(entry.score) > 100)
    );

    if (invalidGrades.length > 0) {
      setError('All grades must be numbers between 0 and 100');
      return;
    }

    // In a real app, we would save these to a database
    // For now, we'll just show success message
    console.log('Saving grades:', {
      classId: selectedClassId,
      type: selectedGradeType,
      grades: studentGrades
    });

    setShowSuccess(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['Student Name', 'Grade Type', 'Score'],
      ...studentGrades
        .filter(entry => entry.score !== '')
        .map(entry => [
          entry.student_name,
          selectedGradeType,
          entry.score
        ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `grades_${selectedClassId}_${selectedGradeType.toLowerCase()}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grade Entry</CardTitle>
          <CardDescription>Enter and manage student grades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Select Class</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {myClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeType">Grade Type</Label>
              <Select
                value={selectedGradeType}
                onValueChange={(value: GradeType) => setSelectedGradeType(value)}
              >
                <SelectTrigger id="gradeType">
                  <SelectValue placeholder="Select grade type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Exam">Exam</SelectItem>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClassId && (
            <div className="space-y-4">
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Student Name</th>
                      <th className="px-4 py-2 text-left">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGrades.map((entry) => (
                      <tr key={entry.student_id} className="border-t">
                        <td className="px-4 py-2">{entry.student_name}</td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={entry.score}
                            onChange={(e) => handleScoreChange(entry.student_id, e.target.value)}
                            placeholder="Enter grade (0-100)"
                            className="w-32"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!selectedClassId || studentGrades.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Grades
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedClassId || studentGrades.length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Grades
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grades Saved</DialogTitle>
            <DialogDescription>
              The grades have been saved successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccess(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}