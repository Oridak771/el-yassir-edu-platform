"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const staticIssues = [
  { id: '1', subject: 'Homework', description: 'Issue with math homework', status: 'Open' },
  { id: '2', subject: 'Attendance', description: 'Absence not justified', status: 'Closed' },
];

export default function ParentIssuesPage() {
  const [issues] = useState(staticIssues);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reported Issues</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {issues.map(issue => (
            <li key={issue.id} className="mb-2">
              <strong>{issue.subject}</strong>: {issue.description} <span className="ml-2">[{issue.status}]</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}