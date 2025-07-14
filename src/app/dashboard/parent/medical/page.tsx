'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import FileUploader from '@/components/FileUploader';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const medicalData = [
  { id: '1', type: 'Vaccination', status: 'Submitted' },
  { id: '2', type: 'Doctor Note', status: 'Pending' },
];

export default function ParentMedicalPage() {
  const [medicalDocs] = useState(medicalData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {medicalDocs.map(doc => (
            <li key={doc.id} className="mb-2">
              <strong>{doc.type}</strong> <span className="ml-2">[{doc.status}]</span>
            </li>
          ))}
        </ul>
        <FileUploader bucket="medical" folder="parent" userId="1" documentType="medical" onUploadComplete={() => {}} />
      </CardContent>
    </Card>
  );
}