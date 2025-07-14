'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const adminDocsData = [
  { id: '1', document_name: 'Enrollment Form', status: 'pending_pickup', available_from: '2025-06-01', pickup_location: 'Orientation Desk' },
  { id: '2', document_name: 'Medical Certificate', status: 'picked_up', available_from: '2025-06-02', pickup_location: 'Main Office' },
];

export default function OrientationAdminDocsPage() {
  const [docAlerts] = useState(adminDocsData);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Document</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Available From</TableHeaderCell>
              <TableHeaderCell>Pickup Location</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {docAlerts.map(doc => (
              <TableRow key={doc.id}>
                <TableCell>{doc.document_name}</TableCell>
                <TableCell><Badge>{doc.status}</Badge></TableCell>
                <TableCell>{doc.available_from}</TableCell>
                <TableCell>{doc.pickup_location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}