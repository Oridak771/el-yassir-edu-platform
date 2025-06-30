'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import FileUploader from '@/components/FileUploader'; // Uncommented
import { Textarea } from '@/components/ui/textarea'; // Uncommented
import { Label } from '@/components/ui/label'; // Uncommented
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; // Uncommented
import { Input } from '@/components/ui/input'; // Added Input for optional fields

// Type for user profile, assuming metadata structure
type UserProfileWithChildren = {
    id: string;
    full_name: string;
    metadata?: {
        children_ids?: string[];
    }
};

// Type for joined child data
type ChildInfoFromDB = {
    full_name: string;
};

// Type for fetched correction request data
type CorrectionRequestQueryResult = {
  id: string;
  child_id: string;
  subject?: string | null;
  assignment_name?: string | null;
  request_details: string;
  scan_url: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  submitted_at: string;
  child: unknown; // Use unknown for joined data initially
};

type CorrectionRequest = {
  id: string;
  child_id: string;
  child_name: string;
  subject?: string | null;
  assignment_name?: string | null;
  request_details: string;
  scan_url: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  submitted_at: string;
};

export default function ParentCorrectionsPage() {
  const [myRequests, setMyRequests] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  // State for the new request form
  const [newRequestChildId, setNewRequestChildId] = useState<string>('');
  const [newRequestSubject, setNewRequestSubject] = useState<string>(''); // Optional subject
  const [newRequestAssignment, setNewRequestAssignment] = useState<string>(''); // Optional assignment
  const [newRequestDetails, setNewRequestDetails] = useState<string>('');
  const [newRequestFileUrl, setNewRequestFileUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfileWithChildren | null>(null);
  const [childrenList, setChildrenList] = useState<{id: string, name: string}[]>([]); // To populate child select

  const fetchCorrectionRequests = useCallback(async (parentId: string, childrenIds: string[]) => {
    if (!parentId || !childrenIds || childrenIds.length === 0) {
        setMyRequests([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('correction_requests')
      .select(`
        id, child_id, subject, assignment_name, request_details, scan_url, status, submitted_at,
        child:users!correction_requests_child_id_fkey(full_name)
      `)
      .eq('parent_id', parentId) // Fetch requests submitted by this parent
      // .in('child_id', childrenIds) // Redundant if parent_id is set correctly on insert
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching correction requests:', error);
      setMyRequests([]);
    } else if (data) {
      // Format data with robust type checking for joined child field
      const formattedRequests = (data as CorrectionRequestQueryResult[]).map(r => {
          let childName = 'Unknown Child';
          // Check if child data is a valid object
          if (r.child && typeof r.child === 'object' && !Array.isArray(r.child) && 'full_name' in r.child) {
              childName = (r.child as ChildInfoFromDB).full_name || childName;
          }
          // TODO: Could add a fallback here to fetch child name from childrenList if join failed

          return {
            id: r.id,
            child_id: r.child_id,
            child_name: childName,
            subject: r.subject,
            assignment_name: r.assignment_name,
            request_details: r.request_details,
            scan_url: r.scan_url,
            status: r.status,
            submitted_at: r.submitted_at,
          };
      });
      setMyRequests(formattedRequests);
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

      const childrenIds = profile?.metadata?.children_ids;
      if (profile && childrenIds && Array.isArray(childrenIds) && childrenIds.length > 0) {
        // Fetch children names for select dropdown
        const { data: childrenData, error: childrenError } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', childrenIds);

        if (childrenError) {
            console.error("Error fetching children names:", childrenError);
        } else if (childrenData) {
            setChildrenList(childrenData.map(c => ({id: c.id, name: c.full_name})));
        }

        // Fetch existing requests
        fetchCorrectionRequests(profile.id, childrenIds);
      } else {
          console.log("No children found for parent or profile missing.");
          setLoading(false);
      }
    };
    init();
  }, [fetchCorrectionRequests]);

  const handleFileUploadComplete = (fileUrl: string) => {
    setNewRequestFileUrl(fileUrl);
  };

  const resetForm = () => {
      setNewRequestChildId('');
      setNewRequestSubject('');
      setNewRequestAssignment('');
      setNewRequestDetails('');
      setNewRequestFileUrl(null);
      setShowRequestForm(false);
  };

  const handleSubmitRequest = async () => {
    if (!currentUser?.id || !newRequestChildId || !newRequestDetails || !newRequestFileUrl) {
      alert('Please select your child, provide details, and upload a scan.');
      return;
    }
    setIsSubmitting(true);

    const { data, error } = await supabase.from('correction_requests').insert([{
      parent_id: currentUser.id,
      child_id: newRequestChildId,
      subject: newRequestSubject || null, // Use null if empty
      assignment_name: newRequestAssignment || null, // Use null if empty
      request_details: newRequestDetails,
      scan_url: newRequestFileUrl,
      status: 'pending',
    }]).select(); // Select to potentially get the inserted data back if needed

    if (error) {
      console.error("Error submitting request:", error);
      alert(`Error submitting request: ${error.message}`);
    } else {
      alert('Request submitted successfully!');
      resetForm();
      // Refresh list by calling fetch again
      if (currentUser?.id && currentUser.metadata?.children_ids) {
          fetchCorrectionRequests(currentUser.id, currentUser.metadata.children_ids);
      }
    }
    setIsSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return 'text-orange-600 bg-orange-100';
        case 'reviewed': return 'text-blue-600 bg-blue-100';
        case 'approved': return 'text-green-600 bg-green-100';
        case 'rejected': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Exam Correction Requests</h1>
        <Button onClick={() => setShowRequestForm(true)}>Submit New Request</Button>
      </div>

      {showRequestForm && currentUser && ( // Only show form if logged in
        <Card>
          <CardHeader><CardTitle>New Correction Request</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="childSelect">Select Child *</Label>
              <Select onValueChange={setNewRequestChildId} value={newRequestChildId} required>
                <SelectTrigger id="childSelect"><SelectValue placeholder="Select your child" /></SelectTrigger>
                <SelectContent>
                  {childrenList.length === 0 ? (
                     <SelectItem value="no_child" disabled>No children found</SelectItem>
                  ) : (
                     childrenList.map(child => <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="subjectSelect">Subject (Optional)</Label>
                    <Input id="subjectSelect" placeholder="e.g., Mathematics" value={newRequestSubject} onChange={e => setNewRequestSubject(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="assignmentSelect">Exam/Assignment (Optional)</Label>
                    <Input id="assignmentSelect" placeholder="e.g., Midterm Exam" value={newRequestAssignment} onChange={e => setNewRequestAssignment(e.target.value)} />
                </div>
            </div>
            <div>
              <Label htmlFor="requestDetails">Details of Correction Request *</Label>
              <Textarea id="requestDetails" value={newRequestDetails} onChange={e => setNewRequestDetails(e.target.value)} required placeholder="Please explain the reason for the correction request..." />
            </div>
            <div>
              <Label>Upload Scan of Exam Paper *</Label>
              <FileUploader
                bucket="documents" // Use your designated bucket
                folder="correction_scans" // Folder for scans
                userId={currentUser.id}
                documentType="correction_scan"
                onUploadComplete={handleFileUploadComplete}
                allowedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
                maxSizeMB={5}
              />
              {newRequestFileUrl && <p className="text-sm text-green-600 mt-1">File uploaded successfully!</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmitRequest} disabled={isSubmitting || !newRequestChildId || !newRequestDetails || !newRequestFileUrl}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button variant="ghost" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Submitted Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading requests...</p>}
          {!loading && myRequests.length === 0 && <p>You have not submitted any correction requests.</p>}
          {!loading && myRequests.length > 0 && (
            <ul className="mt-4 space-y-3">
              {myRequests.map(req => (
                <li key={req.id} className="p-3 border rounded-md">
                  <strong>{req.child_name}</strong> - {req.subject || 'N/A'} - {req.assignment_name || 'N/A'}
                  <p className="text-sm my-1">Details: {req.request_details}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Submitted: {new Date(req.submitted_at).toLocaleDateString()}</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(req.status)}`}>
                        {req.status.toUpperCase()}
                    </span>
                  </div>
                  {req.scan_url && <Button variant="link" size="sm" asChild className="px-0 h-auto py-1"><a href={req.scan_url} target="_blank" rel="noopener noreferrer">View Scan</a></Button>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}