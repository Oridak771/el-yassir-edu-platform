'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CalendarView from '@/components/CalendarView';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const appointmentsData = [
  { id: '1', title: 'Parent-Teacher Meeting', start: '2025-06-15T10:00:00', end: '2025-06-15T10:30:00', event_type: 'parent_appointment', location: 'Room 201' },
  { id: '2', title: 'Guidance Session', start: '2025-06-16T11:00:00', end: '2025-06-16T11:30:00', event_type: 'parent_appointment', location: 'Room 202' },
];

export default function OrientationAppointmentsPage() {
  const [appointments] = useState(appointmentsData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <CalendarView userRole="orientation" userId="1" sampleEvents={appointments} />
      </CardContent>
    </Card>
  );
}