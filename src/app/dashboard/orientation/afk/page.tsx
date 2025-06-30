'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Using Table
import { Badge } from '@/components/ui/badge'; // Uncommented
import { Textarea } from '@/components/ui/textarea'; // For review comments
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Type for joined data
type StudentInfoFromDB = { full_name: string; };
type ClassInfoFromDB = { name: string; };

// Type for fetched absence data
type AbsenceQueryResult = {
  id: string; // absence_id
  student_id: string;
  class_id?: string | null;
  date: string;
  justified: boolean;
  justification_document_url?: string | null;
  // Assuming metadata might store review status and comments
  metadata?: {
    review_status?: 'pending_review' | 'approved' | 'rejected'; // More granular than just 'justified'
    review_comments?: string;
    reviewed_by?: string; // Supervisor ID
  } | null;
  student: unknown; // Use unknown for joined data initially
  class: unknown;   // Use unknown for joined data initially
};

type AbsenceJustification = {
  id: string; // absence_id
  student_id: string;
  student_name: string;
  class_name: string;
  absence_date: string;
  justification_document_url: string; // Should exist for this page
  justified_by_parent: boolean; // The original 'justified' field from parent upload
  review_status: 'pending_review' | 'approved' | 'rejected'; // Derived or from metadata
  review_comments?: string | null;
};

export default function OrientationAfkPage() {
  const [justifications, setJustifications] = useState<AbsenceJustification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceJustification | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchJustifications = useCallback(async () => {
    setLoading(true);
    // Fetch absences that have a justification document
    const { data, error } = await supabase
      .from('absences')
      .select(`
        id, student_id, class_id, date, justified, justification_document_url, metadata,
        student:student_id(full_name),
        class:class_id(name)
      `)
      .not('justification_document_url', 'is', null) // Only those with documents
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching AFK justifications:', error);
      setJustifications([]);
    } else if (data) {
      const formatted = (data as AbsenceQueryResult[]).map(a => {
        let studentName = 'Unknown Student';
        if (a.student && typeof a.student === 'object' && !Array.isArray(a.student) && 'full_name' in a.student) {
            studentName = (a.student as StudentInfoFromDB).full_name || studentName;
        }
        let className = 'N/A';
        if (a.class && typeof a.class === 'object' && !Array.isArray(a.class) && 'name' in a.class) {
            className = (a.class as ClassInfoFromDB).name || className;
        }
        return {
            id: a.id,
            student_id: a.student_id,
            student_name: studentName,
            class_name: className,
            absence_date: a.date,
            justification_document_url: a.justification_document_url!, // We filtered for non-null
            justified_by_parent: a.justified, // Original status set by parent
            review_status: a.metadata?.review_status || (a.justified ? 'approved' : 'pending_review'), // Infer or use metadata
            review_comments: a.metadata?.review_comments,
        };
      });
      setJustifications(formatted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user); // Store auth user for reviewed_by
      fetchJustifications();
    };
    init();
  }, [fetchJustifications]);

  const handleOpenReviewDialog = (absence: AbsenceJustification) => {
    setSelectedAbsence(absence);
    setReviewComments(absence.review_comments || '');
    setShowReviewDialog(true);
  };

  const handleReviewJustification = async (newStatus: 'approved' | 'rejected') => {
    if (!selectedAbsence || !currentUser) return;
    setIsSubmittingReview(true);

    const updateData: Partial<AbsenceQueryResult> & { metadata?: any } = {
        justified: newStatus === 'approved', // Update the main 'justified' flag
        metadata: {
            ...(selectedAbsence as any).metadata, // Preserve existing metadata
            review_status: newStatus,
            review_comments: reviewComments,
            reviewed_by: currentUser.id,
            reviewed_at: new Date().toISOString(),
        }
    };

    const { error } = await supabase
        .from('absences')
        .update(updateData)
        .eq('id', selectedAbsence.id);

    if (error) {
        console.error("Error updating justification review:", error);
        alert(`Failed to update review: ${error.message}`);
    } else {
        alert(`Justification for ${selectedAbsence.student_name} on ${new Date(selectedAbsence.absence_date).toLocaleDateString()} has been ${newStatus}.`);
        setShowReviewDialog(false);
        setSelectedAbsence(null);
        fetchJustifications(); // Refresh list
    }
    setIsSubmittingReview(false);
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | null | undefined => {
    switch (status) {
        case 'approved': return 'default'; // Greenish
        case 'rejected': return 'destructive';
        case 'pending_review': return 'secondary';
        default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AFK / Absence Justifications Review</h1>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Justifications for Review</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading justifications...</p>}
          {!loading && justifications.length === 0 && <p>No absence justifications submitted or awaiting review.</p>}
          {!loading && justifications.length > 0 && (
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Student</TableHeaderCell>
                        <TableHeaderCell>Class</TableHeaderCell>
                        <TableHeaderCell>Absence Date</TableHeaderCell>
                        <TableHeaderCell>Document</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {justifications.map(just => (
                        <TableRow key={just.id}>
                            <TableCell>{just.student_name}</TableCell>
                            <TableCell>{just.class_name}</TableCell>
                            <TableCell>{new Date(just.absence_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Button variant="link" size="sm" asChild className="px-0 h-auto">
                                    <a href={just.justification_document_url} target="_blank" rel="noopener noreferrer">View PDF</a>
                                </Button>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(just.review_status)} className="capitalize">
                                    {just.review_status.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleOpenReviewDialog(just)}>
                                    Review
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedAbsence && (
        <Dialog open={showReviewDialog} onOpenChange={(isOpen) => { if(!isOpen) setSelectedAbsence(null); setShowReviewDialog(isOpen);}}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Review Justification: {selectedAbsence.student_name}</DialogTitle>
                    <p className="text-sm text-gray-500">Absence Date: {new Date(selectedAbsence.absence_date).toLocaleDateString()}</p>
                </DialogHeader>
                <div className="py-4 space-y-3">
                    <div>
                        <Label htmlFor="reviewDocLink">Justification Document</Label>
                        <Button variant="link" asChild className="block px-0 h-auto">
                            <a href={selectedAbsence.justification_document_url} target="_blank" rel="noopener noreferrer" id="reviewDocLink">
                                View Submitted Document
                            </a>
                        </Button>
                    </div>
                    <div>
                        <Label htmlFor="reviewComments">Review Comments (Optional)</Label>
                        <Textarea
                            id="reviewComments"
                            value={reviewComments}
                            onChange={(e) => setReviewComments(e.target.value)}
                            rows={3}
                            placeholder="e.g., Valid doctor's note, reason insufficient..."
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="destructive" onClick={() => handleReviewJustification('rejected')} disabled={isSubmittingReview}>
                        {isSubmittingReview ? 'Rejecting...' : 'Reject'}
                    </Button>
                    <div className="space-x-2 rtl:space-x-reverse">
                        <Button variant="outline" onClick={() => {setShowReviewDialog(false); setSelectedAbsence(null);}} disabled={isSubmittingReview}>Cancel</Button>
                        <Button onClick={() => handleReviewJustification('approved')} disabled={isSubmittingReview} className="bg-green-600 hover:bg-green-700">
                            {isSubmittingReview ? 'Approving...' : 'Approve'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}