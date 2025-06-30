'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import CalendarView from '@/components/CalendarView';
import Chart from '@/components/Chart';
import PDFGenerator from '@/components/PDFGenerator';
import NotificationBell from '@/components/NotificationBell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';

export default function AdministrationDashboard() {
  const [teacherStats, setTeacherStats] = useState<{ className: string; teachers: number }[]>([]);
  const [teacherList, setTeacherList] = useState<{ className: string; teacherName: string; subject: string }[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [councilAlerts, setCouncilAlerts] = useState<{ type: string; message: string; date: string }[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUserId(session.user.id);

      // Fetch teacher assignments for chart and table
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select('class_id, teacher_id, subject');
      if (!assignments) return;

      const stats: { className: string; teachers: number }[] = [];
      const teacherRows: { className: string; teacherName: string; subject: string }[] = [];
      for (const a of assignments) {
        const { data: cls } = await supabase.from('classes').select('name').eq('id', a.class_id).single();
        const { data: teacher } = await supabase.from('users').select('full_name').eq('id', a.teacher_id).single();
        if (cls && teacher) {
          // Chart
          const index = stats.findIndex(s => s.className === cls.name);
          if (index >= 0) stats[index].teachers++;
          else stats.push({ className: cls.name, teachers: 1 });
          // Table
          teacherRows.push({ className: cls.name, teacherName: teacher.full_name, subject: a.subject });
        }
      }
      setTeacherStats(stats);
      setTeacherList(teacherRows);

      // Simulate council alerts (in real app, fetch from notifications/orientation_forms)
      setCouncilAlerts([
        { type: 'Orientation Council', message: 'Results for 2025 session are available.', date: '2025-05-06' },
        { type: 'Reevaluation Council', message: 'Discipline council alert: Student X - 2 day suspension.', date: '2025-05-05' }
      ]);
    };
    init();
  }, []);

  const certFields = [
    { name: 'School', value: 'El Yassir Education', x: 50, y: 700 },
    { name: 'Date', value: new Date().toLocaleDateString(), x: 400, y: 700 },
    { name: 'To', value: '[Student Name]', x: 50, y: 650 },
    { name: 'Certification', value: 'This certifies that ...', x: 50, y: 600 }
  ];

  // Sample events for calendar
  const adminEvents = [
    { id: '1', title: 'Registration Deadline', start: '2025-09-01', end: '2025-09-01', event_type: 'reminder' },
    { id: '2', title: 'Orientation Council', start: '2025-05-06', end: '2025-05-06', event_type: 'meeting' },
    { id: '3', title: 'Extra Course: Math Training', start: '2025-06-10', end: '2025-06-12', event_type: 'training' },
    { id: '4', title: 'Discipline Council', start: '2025-05-05', end: '2025-05-05', event_type: 'meeting' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Administration Dashboard</h1>
        <NotificationBell userId={userId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vacation, Exam & Meeting Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarView userRole="admin" userId={userId} eventTypes={[ 'vacation', 'exam', 'meeting', 'reminder', 'training' ]} sampleEvents={adminEvents} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teachers per Class (Chart)</CardTitle>
        </CardHeader>
        <CardContent>
          <Chart
            title="Teachers per Class"
            type="bar"
            data={teacherStats}
            xKey="className"
            dataKey="teachers"
            width="100%"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Class</TableHeaderCell>
                <TableHeaderCell>Teacher</TableHeaderCell>
                <TableHeaderCell>Subject</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teacherList.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.className}</TableCell>
                  <TableCell>{row.teacherName}</TableCell>
                  <TableCell>{row.subject}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orientation & Reevaluation Council Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {councilAlerts.map((alert, idx) => (
              <li key={idx} className="text-sm flex items-center gap-2">
                <span className="font-semibold">[{alert.type}]</span>
                <span>{alert.message}</span>
                <span className="text-gray-500">({alert.date})</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>School Certification Request (PDF)</CardTitle>
        </CardHeader>
        <CardContent>
          <PDFGenerator
            title="School Certification Request"
            filename="certification.pdf"
            fields={certFields}
          />
        </CardContent>
      </Card>
    </div>
  );
}
