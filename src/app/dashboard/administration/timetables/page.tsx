"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const timetablesData = [
  { id: '1', event: 'Math Class', time: '09:00 - 10:00', day: 'Monday' },
  { id: '2', event: 'Science Class', time: '10:00 - 11:00', day: 'Tuesday' },
];

export default function AdministrationTimetablesPage() {
  const [timetables] = useState(timetablesData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timetables</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {timetables.map(t => (
            <li key={t.id}>{t.event} - {t.day} ({t.time})</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}