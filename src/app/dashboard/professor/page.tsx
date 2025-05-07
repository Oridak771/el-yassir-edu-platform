'use client'; // Make this a client component

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import CalendarView from '@/components/CalendarView'; // Example component
import NotificationBell from '@/components/NotificationBell'; // Example component

export default function ProfessorDashboard() {
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

  // Fetch professor-specific data here (e.g., assigned classes, student lists, schedules)

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Professor Dashboard</h1>
        <NotificationBell userId={user.id} /> {/* Pass user ID */}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Teaching Schedule</CardTitle>
            <CardDescription>Your upcoming classes</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Integrate CalendarView or a list */}
            <p>Schedule placeholder</p>
            {/* <CalendarView initialEvents={[]} /> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>List of classes you teach</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Display list of classes, link to details */}
            <p>Class list placeholder.</p>
            <ul>
              {/* Example: <li>Class 101 - <Link href="/dashboard/professor/class/101">Details</Link></li> */}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Assignments needing review</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Display assignment submission summary */}
            <p>Submissions placeholder.</p>
          </CardContent>
        </Card>
      </div>

       {/* Add more professor-specific components/sections as needed */}
       {/* e.g., Gradebook access, Communication tools */}
    </div>
  );
}
