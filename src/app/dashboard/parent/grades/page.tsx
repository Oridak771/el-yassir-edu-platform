'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Chart from '@/components/Chart';
import PDFGenerator from '@/components/PDFGenerator';

const gradesData = [
  { id: '1', subject: 'Math', grade: 85 },
  { id: '2', subject: 'Science', grade: 92 },
  { id: '3', subject: 'History', grade: 78 },
];

export default function ParentGradesPage() {
  const [grades] = useState(gradesData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grades</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {grades.map(g => (
            <li key={g.id} className="mb-2">
              <strong>{g.subject}</strong>: {g.grade}
            </li>
          ))}
        </ul>
        <Chart title="Grades Overview" type="bar" data={grades} xKey="subject" dataKey="grade" />
        <PDFGenerator />
      </CardContent>
    </Card>
  );
}