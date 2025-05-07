'use client'; // Make this a client component

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import CalendarView from '@/components/CalendarView'; // Example component
import NotificationBell from '@/components/NotificationBell'; // Example component

export default function OrientationSupervisorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Fetch orientation-specific data here (e.g., student enrollment status, orientation schedules)

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Orientation Supervisor Dashboard</h1>
        <NotificationBell userId={user.id} /> {/* Pass user ID */}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Orientation Schedule</CardTitle>
            <CardDescription>Upcoming orientation events</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Integrate CalendarView or a list */}
            <p>Orientation schedule placeholder</p>
            {/* <CalendarView initialEvents={[]} /> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Student Enrollments</CardTitle>
            <CardDescription>List of newly registered students</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Display list of new students */}
            <p>Enrollment list placeholder.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks & Follow-ups</CardTitle>
            <CardDescription>Pending orientation tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Display task list */}
            <p>Task list placeholder.</p>
          </CardContent>
        </Card>
      </div>

       {/* Add more orientation-specific components/sections */}
       {/* e.g., Resource management, Communication tools */}
    </div>
  );
}
