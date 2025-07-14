'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const studentFiles = [
  {
    id: '1',
    name: 'Student Enrollment Form',
    type: 'PDF',
    date: '2024-08-20',
    url: '/path/to/enrollment-form.pdf',
  },
  {
    id: '2',
    name: 'Previous School Records',
    type: 'PDF',
    date: '2024-08-22',
    url: '/path/to/school-records.pdf',
  },
  {
    id: '3',
    name: 'Orientation Welcome Packet',
    type: 'DOCX',
    date: '2024-08-25',
    url: '/path/to/welcome-packet.docx',
  },
];

export default function OrientationStudentsPage() {
  const handleDownload = (url: string) => {
    console.log(`Downloading from: ${url}`);
    alert(`Simulating download from: ${url}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>File Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Date Uploaded</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {studentFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{file.name}</TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>{file.date}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(file.url)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
