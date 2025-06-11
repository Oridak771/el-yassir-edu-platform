'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import { Textarea } from '@/components/ui/textarea'; // Uncommented
import { Label } from '@/components/ui/label'; // Uncommented
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; // Uncommented
import { Input } from '@/components/ui/input'; // Added

// Type for user profile, assuming metadata structure
type UserProfileWithChildren = {
    id: string;
    full_name: string;
    metadata?: {
        children_ids?: string[];
    }
};

// Type for fetched report data
type ReportQueryResult = {
  id: string;
  child_id: string;
  teacher_id?: string | null;
  teacher_name_manual?: string | null;
  issue_details: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'closed';
  submitted_at: string;
  resolution_details?: string | null;
  child: { full_name: string } | null; // Joined data
  teacher: { full_name: string } | null; // Joined data (optional)
};

type TeacherIssueReport = {
  id: string;
  parent_id: string; // Added for consistency, though fetched by parent_id
  child_id: string;
  child_name: string;
  teacher_id?: string | null;
  teacher_name: string; // Combined from joined data or manual input
  issue_details: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'closed';
  submitted_at: string;
  resolution_details?: string | null;
};

export default function ParentTeacherIssuesPage() {
  const [myReports, setMyReports] = useState<TeacherIssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  // Form state
  const [newReportChildId, setNewReportChildId] = useState<string>('');
  const [newReportTeacherName, setNewReportTeacherName] = useState<string>(''); // Manual teacher name input
  const [newReportDetails, setNewReportDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfileWithChildren | null>(null);
  const [childrenList, setChildrenList] = useState<{id: string, name: string}[]>([]);
  // const [teachersList, setTeachersList] = useState<{id: string, name: string}[]>([]); // Fetching teachers might be complex, using manual input for now

  const fetchReports = useCallback(async (parentId: string) => {
    if (!parentId) {
        setMyReports([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('teacher_issue_reports')
      .select(`
        *,
        child:child_id(full_name),
        teacher:teacher_id(full_name)
      `)
      .eq('parent_id', parentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      setMyReports([]);
    } else if (data) {
      const formattedReports = (data as ReportQueryResult[]).map(r => ({
        id: r.id,
        parent_id: parentId, // Add parent_id back if needed elsewhere
        child_id: r.child_id,
        child_name: r.child?.full_name ?? 'Unknown Child',
        teacher_id: r.teacher_id,
        teacher_name: r.teacher?.full_name ?? r.teacher_name_manual ?? 'N/A', // Prioritize joined name
        issue_details: r.issue_details,
        status: r.status,
        submitted_at: r.submitted_at,
        resolution_details: r.resolution_details,
      }));
      setMyReports(formattedReports);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
          setLoading(false);
          // Redirect?
          return;
      }

      const profile = await getUserProfile(session.user.id) as UserProfileWithChildren | null;
      setCurrentUser(profile);

      if (profile) {
        // Fetch children if applicable
        const childrenIds = profile.metadata?.children_ids;
        if (childrenIds && Array.isArray(childrenIds) && childrenIds.length > 0) {
          const { data: childrenData, error: childrenError } = await supabase
              .from('users')
              .select('id, full_name')
              .in('id', childrenIds);
          if (childrenError) {
              console.error("Error fetching children names:", childrenError);
          } else if (childrenData) {
              setChildrenList(childrenData.map(c => ({id: c.id, name: c.full_name})));
          }
        }
        // Fetch existing reports
        fetchReports(profile.id);
      } else {
          setLoading(false);
      }
    };
    init();
  }, [fetchReports]);

  const resetForm = () => {
      setNewReportChildId('');
      setNewReportTeacherName('');
      setNewReportDetails('');
      setShowReportForm(false);
  };

  const handleSubmitReport = async () => {
    if (!currentUser?.id || !newReportChildId || !newReportDetails) {
      alert('Please select your child and provide details of the issue.');
      return;
    }
    setIsSubmitting(true);

    // Note: We are not linking to a specific teacher_id here, just storing the name manually.
    // Linking would require fetching teachers associated with the child's classes.
    const { data, error } = await supabase.from('teacher_issue_reports').insert([{
      parent_id: currentUser.id,
      child_id: newReportChildId,
      teacher_name_manual: newReportTeacherName || null, // Store manually entered name
      issue_details: newReportDetails,
      status: 'submitted',
    }]).select();

    if (error) {
      console.error("Error submitting report:", error);
      alert(`Error submitting report: ${error.message}`);
    } else {
      alert('Report submitted successfully. School administration will review it.');
      resetForm();
      // Refresh list
      if (currentUser?.id) {
          fetchReports(currentUser.id);
      }
    }
    setIsSubmitting(false);
  };

   const getStatusColor = (status: string) => {
    switch (status) {
        case 'submitted': return 'text-blue-600 bg-blue-100';
        case 'under_review': return 'text-yellow-600 bg-yellow-100';
        case 'resolved': return 'text-green-600 bg-green-100';
        case 'closed': return 'text-gray-600 bg-gray-100';
        default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Report Teacher-Related Issue</h1>
        <Button onClick={() => setShowReportForm(true)}>Submit New Report</Button>
      </div>

      {showReportForm && currentUser && (
        <Card>
          <CardHeader><CardTitle>New Teacher Issue Report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="childIssueSelect">Select Your Child *</Label>
              <Select onValueChange={setNewReportChildId} value={newReportChildId} required>
                <SelectTrigger id="childIssueSelect"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childrenList.length === 0 ? (
                     <SelectItem value="no_child" disabled>No children found</SelectItem>
                  ) : (
                     childrenList.map(child => <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="teacherIssueInput">Teacher's Name (Optional)</Label>
              <Input
                id="teacherIssueInput"
                placeholder="Enter teacher's name if known"
                value={newReportTeacherName}
                onChange={e => setNewReportTeacherName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="issueDetails">Describe the Issue *</Label>
              <Textarea
                id="issueDetails"
                value={newReportDetails}
                onChange={e => setNewReportDetails(e.target.value)}
                required
                placeholder="Please provide specific details about the issue..."
                rows={5}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmitReport} disabled={isSubmitting || !newReportChildId || !newReportDetails}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
              <Button variant="ghost" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Submitted Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading reports...</p>}
          {!loading && myReports.length === 0 && <p>You have not submitted any teacher issue reports.</p>}
          {!loading && myReports.length > 0 && (
            <ul className="mt-4 space-y-3">
              {myReports.map(report => (
                <li key={report.id} className="p-3 border rounded-md">
                  For <strong>{report.child_name}</strong> (Teacher: {report.teacher_name || 'N/A'})
                  <p className="text-sm my-1">Issue: {report.issue_details}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Submitted: {new Date(report.submitted_at).toLocaleDateString()}</p>
                     <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {report.status === 'resolved' && report.resolution_details &&
                    <p className="text-xs italic text-green-700 mt-1">Resolution: {report.resolution_details}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}