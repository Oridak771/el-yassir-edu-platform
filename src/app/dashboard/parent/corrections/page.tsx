'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import FileUploader from '@/components/FileUploader';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const correctionsData = [
  { id: '1', subject: 'Math', description: 'Correction for math grade', status: 'Pending' },
  { id: '2', subject: 'Science', description: 'Correction for science grade', status: 'Resolved' },
];

export default function ParentCorrectionsPage() {
  const [corrections] = useState(correctionsData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Correction Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {corrections.map(corr => (
            <li key={corr.id} className="mb-2">
              <strong>{corr.subject}</strong>: {corr.description} <span className="ml-2">[{corr.status}]</span>
            </li>
          ))}
        </ul>
        <FileUploader />
      </CardContent>
    </Card>
  );
}