import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const certificatesData = [
  { id: '1', student: 'Jane Doe', type: 'Attendance', date: '2025-06-10' },
  { id: '2', student: 'Bob Smith', type: 'Achievement', date: '2025-06-11' },
];

export default function AdministrationCertificatesPage() {
  const [certificates] = useState(certificatesData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificates</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {certificates.map(c => (
            <li key={c.id}>
              <strong>{c.student}</strong> - {c.type} ({c.date})
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}