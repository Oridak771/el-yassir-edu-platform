'use client'; // Make this a client component

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import CalendarView from '@/components/CalendarView';
import NotificationBell from '@/components/NotificationBell';

export default function OrientationSupervisorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and static user
    setTimeout(() => {
      setUser({ id: '1', email: 'user@example.com', full_name: 'John Doe' });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in.</div>;
  }

  // Fetch orientation-specific data here (e.g., student enrollment status, orientation schedules)

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Orientation Supervisor Dashboard</CardTitle>
          <CardDescription>Welcome, {user.full_name}</CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView userRole="orientation" userId={user.id} />
          <NotificationBell userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
