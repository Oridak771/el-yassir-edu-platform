'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const meetingsData = [
  { id: '1', title: 'Staff Meeting', date: '2025-06-12', time: '10:00', location: 'Conference Room' },
  { id: '2', title: 'Parent-Teacher Meeting', date: '2025-06-15', time: '14:00', location: 'Room 201' },
];

export default function AdministrationMeetingsPage() {
  const [meetings] = useState(meetingsData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meetings</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {meetings.map(m => (
            <li key={m.id}>
              <strong>{m.title}</strong> - {m.date} at {m.time} ({m.location})
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}