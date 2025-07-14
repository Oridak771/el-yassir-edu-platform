'use client';

import React from 'react';
import { getData } from '@/lib/data';
import { User } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';
import CalendarView from '@/components/CalendarView';
import Chart from '@/components/Chart';
import PDFGenerator from '@/components/PDFGenerator';
import FileUploader from '@/components/FileUploader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function ParentDashboard() {
  const user = getData.getUsersByRole('parent')[0];

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card>
          <CardContent>
            <p className="text-red-500">No parent user found in the system.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get the classes where this parent's children are enrolled
  const studentIds = getData.users()
    .filter(u => u.role === 'student')
    .map(u => u.id)
    .slice(0, 2); // For testing, assume first two students are this parent's children

  const absences = getData.absences()
    .filter(a => studentIds.includes(a.student_id))
    .slice(0, 5);

  const grades = getData.grades()
    .filter(g => studentIds.includes(g.student_id))
    .map(g => ({
      subject: getData.getClassById(g.class_id)?.name || 'Unknown',
      score: g.grade,
      total: 100,
      term: g.term
    }));

  // PDF fields for bulletin
  const pdfFields = grades.map((grade, index) => ({
    name: grade.subject,
    label: grade.subject,
    value: `${grade.score}/${grade.total} (${grade.term})`,
    x: 50,
    y: 100 + (index * 30) // Position each grade 30 units below the previous one
  }));

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <NotificationBell userId={user.id} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Absences</CardTitle>
            <CardDescription>Latest absence records for your children</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {absences.map((absence) => (
                <li key={absence.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {getData.getUserById(absence.student_id)?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getData.getClassById(absence.class_id)?.name}
                      </p>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      absence.status === 'approved' ? 'bg-green-100 text-green-800' :
                      absence.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {absence.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Date: {new Date(absence.date).toLocaleDateString('en-GB')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Reason: {absence.reason}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Grades</CardTitle>
            <CardDescription>Recent academic performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {grades.map((grade, index) => (
                <li key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{grade.subject}</p>
                      <p className="text-sm text-gray-500">{grade.term}</p>
                    </div>
                    <span className={`text-lg font-semibold ${
                      grade.score >= 75 ? 'text-green-600' :
                      grade.score >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {grade.score}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Calendar</CardTitle>
          <CardDescription>Upcoming exams and important dates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <CalendarView userRole="parent" userId={user.id} events={[]} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grade Report</CardTitle>
          <CardDescription>Download your child's grade report</CardDescription>
        </CardHeader>
        <CardContent>
          <PDFGenerator
            title="Grade Report"
            filename="grade_report.pdf"
            fields={pdfFields}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exam Correction Request</CardTitle>
          <CardDescription>Upload scanned exam correction request</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader 
            userId={user.id} 
            folder="exam_corrections" 
            bucket="documents" 
            documentType="exam_correction" 
          />
        </CardContent>
      </Card>
    </div>
  );
}
