'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';

const meetings = [
  {
    id: '1',
    date: '2024-08-20',
    time: '11:00 AM',
    topic: 'New Student Orientation',
    location: 'Auditorium',
  },
  {
    id: '2',
    date: '2024-08-21',
    time: '1:00 PM',
    topic: 'Campus Tour',
    location: 'Main Entrance',
  },
  {
    id: '3',
    date: '2024-08-22',
    time: '3:00 PM',
    topic: 'Q&A with Staff',
    location: 'Library',
  },
];

export default function OrientationMeetingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orientation Meetings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell>Topic</TableHeaderCell>
              <TableHeaderCell>Location</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meetings.map((meeting) => (
              <TableRow key={meeting.id}>
                <TableCell>{meeting.date}</TableCell>
                <TableCell>{meeting.time}</TableCell>
                <TableCell>{meeting.topic}</TableCell>
                <TableCell>{meeting.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
