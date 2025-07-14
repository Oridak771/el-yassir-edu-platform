'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';
import absencesData from '@/data/absences.json';

export default function ParentAbsencesPage() {
  const [absences] = useState(absencesData.absences);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Child's Absences</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Reason</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {absences.map((absence: any) => (
              <TableRow key={absence.id}>
                <TableCell>{absence.date}</TableCell>
                <TableCell>{absence.reason}</TableCell>
                <TableCell>{absence.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}