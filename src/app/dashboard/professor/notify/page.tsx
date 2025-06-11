'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getData } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface StudentInfo {
  id: string;
  name: string;
}

interface ClassInfo {
  id: string;
  name: string;
  students: StudentInfo[];
}

export default function ProfessorNotifyPage() {
  const [targetType, setTargetType] = useState<'class' | 'student' | 'parents_of_class' | 'parent_of_student'>('class');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Get professor data
  const professor = getData.getUsersByRole('professor')[0];
  const classes = getData.getClassesByProfessor(professor?.id || '');
  const classesWithStudents: ClassInfo[] = classes.map(cls => ({
    id: cls.id,
    name: cls.name,
    students: cls.students.map(studentId => {
      const student = getData.getUserById(studentId);
      return {
        id: studentId,
        name: student?.name || 'Unknown Student'
      };
    })
  }));

  // Get students for selected class
  const selectedClassStudents = selectedClassId 
    ? classesWithStudents.find(c => c.id === selectedClassId)?.students || []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notificationTitle || !notificationMessage) {
      return;
    }

    const newNotification = {
      id: crypto.randomUUID(),
      user_id: targetType === 'class' || targetType === 'parents_of_class'
        ? selectedClassId
        : selectedStudentId,
      title: notificationTitle,
      message: notificationMessage,
      type: targetType,
      read: false,
      created_at: new Date().toISOString()
    };

    // In a real app, we'd save this to a database
    console.log('Sending notification:', newNotification);

    // Show success message
    setShowSuccess(true);

    // Reset form
    setNotificationTitle('');
    setNotificationMessage('');
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Notifications</CardTitle>
          <CardDescription>
            Send notifications to your students and their parents
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetType">Notify</Label>
              <Select
                value={targetType}
                onValueChange={(value: 'class' | 'student' | 'parents_of_class' | 'parent_of_student') => {
                  setTargetType(value);
                  setSelectedStudentId('');
                  setSelectedClassId('');
                }}
              >
                <SelectTrigger id="targetType">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Entire Class</SelectItem>
                  <SelectItem value="student">Specific Student</SelectItem>
                  <SelectItem value="parents_of_class">Parents of Class</SelectItem>
                  <SelectItem value="parent_of_student">Parent of Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(targetType === 'class' || targetType === 'parents_of_class') && (
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
                    {classesWithStudents.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(targetType === 'student' || targetType === 'parent_of_student') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="studentClass">Select Class</Label>
                  <Select
                    value={selectedClassId}
                    onValueChange={(value) => {
                      setSelectedClassId(value);
                      setSelectedStudentId('');
                    }}
                  >
                    <SelectTrigger id="studentClass">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesWithStudents.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClassId && (
                  <div className="space-y-2">
                    <Label htmlFor="student">Select Student</Label>
                    <Select
                      value={selectedStudentId}
                      onValueChange={setSelectedStudentId}
                    >
                      <SelectTrigger id="student">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedClassStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Enter notification title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter your message"
                rows={5}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={
                !notificationTitle || 
                !notificationMessage || 
                (targetType === 'class' && !selectedClassId) ||
                (targetType === 'student' && !selectedStudentId)
              }
            >
              Send Notification
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Sent</DialogTitle>
            <DialogDescription>
              Your notification has been sent successfully.
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