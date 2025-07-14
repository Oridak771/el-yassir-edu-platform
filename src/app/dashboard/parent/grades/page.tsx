'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('@/components/Chart'), { ssr: false });
import PDFGenerator from '@/components/PDFGenerator';

const gradesData = [
  { id: '1', subject: 'Math', grade: 85 },
  { id: '2', subject: 'Science', grade: 92 },
  { id: '3', subject: 'History', grade: 78 },
];

export default function ParentGradesPage() {
  const [grades] = useState(gradesData);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const chartData = gradesData.map(g => ({ name: g.subject, value: g.grade }));

  const pdfFields = gradesData.map((grade, index) => ({
    name: grade.subject,
    label: `Grade for ${grade.subject}`,
    value: `${grade.grade}%`,
    x: 50,
    y: 100 + (index * 20),
  }));

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
        <PDFGenerator title="Grades Report" filename="grades.pdf" fields={pdfFields} />
      </CardContent>
    </Card>
  );
}