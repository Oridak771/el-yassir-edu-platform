'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';
import absencesData from '@/data/absences.json';

export default function OrientationAfkPage() {
  const [afkRecords] = useState(absencesData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AFK/Absence Records</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Student</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Reason</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {afkRecords.map((rec: any) => (
              <TableRow key={rec.id}>
                <TableCell>{rec.student_name}</TableCell>
                <TableCell>{rec.date}</TableCell>
                <TableCell>{rec.reason}</TableCell>
                <TableCell>{rec.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}