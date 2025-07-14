'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const questionnairesData = [
  { id: '1', title: 'Orientation Survey', status: 'completed' },
  { id: '2', title: 'Feedback Form', status: 'pending' },
];

export default function OrientationQuestionnairesPage() {
  const [questionnaires] = useState(questionnairesData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orientation Questionnaires</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {questionnaires.map(q => (
            <li key={q.id}>
              <strong>{q.title}</strong> - {q.status}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}