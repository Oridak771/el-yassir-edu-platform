'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import NotificationBell from '@/components/NotificationBell';
import CalendarView from '@/components/CalendarView';
import Chart from '@/components/Chart';
import PDFGenerator from '@/components/PDFGenerator';
import FileUploader from '@/components/FileUploader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ParentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [absences] = useState([
    { date: '2025-05-01', reason: 'Sick', justified: false },
    { date: '2025-05-03', reason: 'Late', justified: true }
  ]);
  const [grades] = useState([
    { subject: 'Math', score: 15, total: 20 },
    { subject: 'Science', score: 18, total: 20 }
  ]);
  const examEvents = [
    { id: '1', title: 'Math Exam', start: '2025-06-01', end: '2025-06-01', event_type: 'exam' },
    { id: '2', title: 'Science Exam', start: '2025-06-10', end: '2025-06-10', event_type: 'exam' }
  ];
  const pdfFields = [
    { name: 'Student', value: '[Child Name]', x: 50, y: 700 },
    { name: 'Period', value: '2024-2025', x: 400, y: 700 },
    { name: 'Grades', value: 'Math: 15/20, Science: 18/20', x: 50, y: 650 }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <NotificationBell userId={user.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Child Absence Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {absences.map((a, i) => (
              <li key={i} className="flex gap-4 items-center">
                <span>{a.date}</span>
                <span>{a.reason}</span>
                <span className={a.justified ? 'text-green-600' : 'text-red-600'}>
                  {a.justified ? 'Justified' : 'Unjustified'}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exam Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarView userRole="parent" userId={user.id} eventTypes={['exam']} sampleEvents={examEvents} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <Chart
            title="Grades"
            type="bar"
            data={grades}
            xKey="subject"
            dataKey="score"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PDF Bulletin</CardTitle>
        </CardHeader>
        <CardContent>
          <PDFGenerator
            title="PDF Bulletin"
            filename="bulletin.pdf"
            fields={pdfFields}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exam Correction Request (Upload Scan)</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader userId={user.id} folder="exam_corrections" bucket="documents" documentType="exam_correction" />
        </CardContent>
      </Card>
    </div>
  );
}
