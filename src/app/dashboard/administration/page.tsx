'use client';

import React, { useEffect, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('@/components/Chart'), { ssr: false });
import PDFGenerator from '@/components/PDFGenerator';
import NotificationBell from '@/components/NotificationBell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';

// Example static data for dashboard widgets
const staticEvents = [
  {
    id: '1',
    title: 'Staff Meeting',
    start: '2025-06-10T10:00:00',
    end: '2025-06-10T11:00:00',
    event_type: 'meeting',
    location: 'Room 101',
  },
  {
    id: '2',
    title: 'Parent-Teacher Conference',
    start: '2025-06-12T14:00:00',
    end: '2025-06-12T15:00:00',
    event_type: 'conference',
    location: 'Main Hall',
  },
];

const staticChartData = [
  { name: 'Jan', value: 30 },
  { name: 'Feb', value: 45 },
  { name: 'Mar', value: 60 },
  { name: 'Apr', value: 50 },
  { name: 'May', value: 80 },
];

export default function AdministrationDashboardPage() {
  // Example: use static data for widgets
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Administration Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Upcoming Events</h2>
          <CalendarView userRole="admin" userId="1" sampleEvents={staticEvents} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Statistics</h2>
          <Chart title="Monthly Activity" type="bar" data={staticChartData} xKey="name" dataKey="value" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">PDF Reports</h2>
        <PDFGenerator 
          title="Administration Report"
          filename="administration_report.pdf"
          fields={[]}
        />
      </div>
    </div>
  );
}
