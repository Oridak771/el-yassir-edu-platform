import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const convocationsData = [
  { id: '1', title: 'Orientation Meeting', message: 'Mandatory for all students', date: '2025-06-20' },
  { id: '2', title: 'Parent Info Session', message: 'For parents of new students', date: '2025-06-22' },
];

export default function OrientationConvocationsPage() {
  const [convocations] = useState(convocationsData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Convocations</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {convocations.map(c => (
            <li key={c.id} className="mb-2">
              <strong>{c.title}</strong>: {c.message} <span className="ml-2">[{c.date}]</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}