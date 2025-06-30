'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase'; // Uncommented
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Uncommented Tabs
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Using Table
import { Badge } from '@/components/ui/badge'; // For status
import Link from 'next/link'; // For linking

// --- Type Definitions ---

// Orientation Results
type OrientationResponseResult = {
  id: string; // response id
  student_id: string;
  decision?: string | null;
  decision_date?: string | null;
  student_name?: string; // Joined
};

// Reevaluation Requests
type CorrectionRequestResult = {
  id: string;
  child_id: string;
  child_name?: string; // Joined
  subject?: string | null;
  assignment_name?: string | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  submitted_at: string;
};

// Discipline Alerts (from notifications)
type DisciplineAlertResult = {
  id: string; // notification id
  title: string;
  message: string;
  created_at: string;
  metadata?: { // Assuming relevant info is in metadata
    student_id?: string;
    student_name?: string; // May need separate fetch if not stored here
    incident_id?: string; // Link to a potential incidents table
  }
};

export default function AdminCouncilsPage() {
  const [orientationResults, setOrientationResults] = useState<OrientationResponseResult[]>([]);
  const [reevaluationRequests, setReevaluationRequests] = useState<CorrectionRequestResult[]>([]);
  const [disciplineAlerts, setDisciplineAlerts] = useState<DisciplineAlertResult[]>([]);
  const [loadingOrientation, setLoadingOrientation] = useState(true);
  const [loadingReevaluation, setLoadingReevaluation] = useState(true);
  const [loadingDiscipline, setLoadingDiscipline] = useState(true);

  const fetchCouncilData = useCallback(async () => {
    setLoadingOrientation(true);
    setLoadingReevaluation(true);
    setLoadingDiscipline(true);

    // Fetch Orientation Results
    const { data: orientationData, error: orientationError } = await supabase
      .from('orientation_responses')
      .select(`
        id, student_id, decision, decision_date,
        student:student_id(full_name)
      `)
      .not('decision', 'is', null) // Only decided ones
      .order('decision_date', { ascending: false })
      .limit(50); // Limit results

    if (orientationError) console.error("Error fetching orientation results:", orientationError);
    else if (orientationData) {
        const formatted = orientationData.map((o: any) => ({ // Use any temporarily for join structure
            id: o.id,
            student_id: o.student_id,
            decision: o.decision,
            decision_date: o.decision_date,
            student_name: o.student?.full_name ?? 'Unknown Student'
        }));
        setOrientationResults(formatted);
    }
    setLoadingOrientation(false);

    // Fetch Reevaluation Requests (Pending/Reviewed)
    const { data: reevalData, error: reevalError } = await supabase
      .from('correction_requests')
      .select(`
        id, child_id, subject, assignment_name, status, submitted_at,
        child:child_id(full_name)
      `)
      .in('status', ['pending', 'reviewed']) // Focus on actionable items
      .order('submitted_at', { ascending: true })
      .limit(50);

    if (reevalError) console.error("Error fetching reevaluation requests:", reevalError);
     else if (reevalData) {
        const formatted = reevalData.map((r: any) => ({
            id: r.id,
            child_id: r.child_id,
            child_name: r.child?.full_name ?? 'Unknown Student',
            subject: r.subject,
            assignment_name: r.assignment_name,
            status: r.status,
            submitted_at: r.submitted_at,
        }));
        setReevaluationRequests(formatted);
    }
    setLoadingReevaluation(false);

    // Fetch Discipline Alerts (from Notifications)
    const { data: disciplineData, error: disciplineError } = await supabase
      .from('notifications')
      .select('id, title, message, created_at, metadata')
      .eq('type', 'discipline_alert') // Assuming a specific type
      .order('created_at', { ascending: false })
      .limit(50);

    if (disciplineError) console.error("Error fetching discipline alerts:", disciplineError);
    else if (disciplineData) {
        // Assuming metadata contains student info, otherwise needs another join/fetch
        setDisciplineAlerts(disciplineData as DisciplineAlertResult[]);
    }
    setLoadingDiscipline(false);

  }, []);

  useEffect(() => {
    fetchCouncilData();
  }, [fetchCouncilData]);

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" | null | undefined => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'reviewed': return 'default'; // Blueish/Default
        case 'approved': return 'default'; // Greenish
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Council Management</h1>

      <Tabs defaultValue="orientation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orientation">Orientation Council</TabsTrigger>
          <TabsTrigger value="reevaluation">Reevaluation Council</TabsTrigger>
          <TabsTrigger value="discipline">Discipline Council</TabsTrigger>
        </TabsList>

        {/* Orientation Tab */}
        <TabsContent value="orientation">
          <Card>
            <CardHeader>
              <CardTitle>Orientation Council Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">View finalized orientation decisions.</p>
              {loadingOrientation && <p>Loading results...</p>}
              {!loadingOrientation && orientationResults.length === 0 && <p>No recent orientation decisions found.</p>}
              {!loadingOrientation && orientationResults.length > 0 && (
                 <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell>Student</TableHeaderCell>
                            <TableHeaderCell>Decision</TableHeaderCell>
                            <TableHeaderCell>Decision Date</TableHeaderCell>
                            <TableHeaderCell>Actions</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orientationResults.map(res => (
                            <TableRow key={res.id}>
                                <TableCell>{res.student_name}</TableCell>
                                <TableCell>{res.decision}</TableCell>
                                <TableCell>{res.decision_date ? new Date(res.decision_date).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell>
                                    {/* Link to student profile or decision details */}
                                    <Button variant="outline" size="sm">View Details</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reevaluation Tab */}
        <TabsContent value="reevaluation">
          <Card>
            <CardHeader>
              <CardTitle>Reevaluation Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Review pending grade correction requests.</p>
               {loadingReevaluation && <p>Loading requests...</p>}
               {!loadingReevaluation && reevaluationRequests.length === 0 && <p>No pending reevaluation requests.</p>}
               {!loadingReevaluation && reevaluationRequests.length > 0 && (
                 <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell>Student</TableHeaderCell>
                            <TableHeaderCell>Subject/Assignment</TableHeaderCell>
                            <TableHeaderCell>Submitted At</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                            <TableHeaderCell>Actions</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reevaluationRequests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell>{req.child_name}</TableCell>
                                <TableCell>{req.subject || 'N/A'} - {req.assignment_name || 'N/A'}</TableCell>
                                <TableCell>{new Date(req.submitted_at).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(req.status)} className="capitalize">{req.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    {/* Link to the request details page or modal */}
                                     <Link href={`/dashboard/parent/corrections?requestId=${req.id}`} passHref> {/* Adjust link if needed */}
                                        <Button variant="outline" size="sm">Review Request</Button>
                                     </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discipline Tab */}
        <TabsContent value="discipline">
          <Card>
            <CardHeader>
              <CardTitle>Discipline Council Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Monitor discipline-related notifications and alerts.</p>
              {loadingDiscipline && <p>Loading alerts...</p>}
              {!loadingDiscipline && disciplineAlerts.length === 0 && <p>No recent discipline alerts.</p>}
              {!loadingDiscipline && disciplineAlerts.length > 0 && (
                 <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell>Date</TableHeaderCell>
                            <TableHeaderCell>Title</TableHeaderCell>
                            <TableHeaderCell>Message Summary</TableHeaderCell>
                            <TableHeaderCell>Related Student</TableHeaderCell>
                            <TableHeaderCell>Actions</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {disciplineAlerts.map(alert => (
                            <TableRow key={alert.id}>
                                <TableCell>{new Date(alert.created_at).toLocaleString()}</TableCell>
                                <TableCell>{alert.title}</TableCell>
                                <TableCell className="max-w-xs truncate">{alert.message}</TableCell>
                                <TableCell>{alert.metadata?.student_name ?? alert.metadata?.student_id ?? 'N/A'}</TableCell>
                                <TableCell>
                                    {/* Link to notification details or related incident report */}
                                    <Button variant="outline" size="sm">View Details</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}