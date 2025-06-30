'use client'; // Make this a client component

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getData } from '@/lib/data';
import { User } from '@/lib/utils';
import CalendarView from '@/components/CalendarView';
import NotificationBell from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { FileText, Edit3, Users, Bell } from 'lucide-react';
import Link from 'next/link';

export default function ProfessorDashboard() {
  // For testing, find the first professor user
  const user = getData.getUsersByRole('professor')[0];

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card>
          <CardContent>
            <p className="text-red-500">No professor user found in the system.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const classes = getData.getClassesByProfessor(user.id);
  const recentGrades = getData.grades().slice(0, 5);
  const recentAbsences = getData.absences().slice(0, 5);

  // Sample events for the calendar
  const sampleEvents = [
    {
      id: '1',
      title: 'Mathematics Class',
      start: '2025-06-08T09:00:00',
      end: '2025-06-08T10:30:00',
      type: 'class'
    },
    {
      id: '2',
      title: 'Department Meeting',
      start: '2025-06-09T14:00:00',
      end: '2025-06-09T15:00:00',
      type: 'meeting'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <NotificationBell userId={user.id} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/professor/grades" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Edit3 className="mr-2 h-4 w-4" />
                Enter Grades
              </Button>
            </Link>
            <Link href="/dashboard/professor/classes" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                View Classes
              </Button>
            </Link>
            <Link href="/dashboard/professor/notify" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Bell className="mr-2 h-4 w-4" />
                Send Notifications
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>Classes you are teaching</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classes.map((cls) => (
                <div key={cls.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.schedule}</p>
                  <p className="text-sm text-gray-500">
                    {cls.students.length} Students
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest grades and absences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Recent Grades</h3>
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="text-sm">
                    <p>{getData.getUserById(grade.student_id)?.name || 'Unknown Student'}</p>
                    <p className="text-gray-500">Grade: {grade.grade}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Recent Absences</h3>
                {recentAbsences.map((absence) => (
                  <div key={absence.id} className="text-sm">
                    <p>{getData.getUserById(absence.student_id)?.name || 'Unknown Student'}</p>
                    <p className="text-gray-500">{new Date(absence.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>Your upcoming classes and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <CalendarView
              userRole="professor"
              userId={user.id}
              sampleEvents={sampleEvents}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
