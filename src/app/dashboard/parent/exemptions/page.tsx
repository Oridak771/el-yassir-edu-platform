'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import FileUploader from '@/components/FileUploader'; // Uncommented
import { Textarea } from '@/components/ui/textarea'; // Added
import { Label } from '@/components/ui/label'; // Added
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; // Added
import { Input } from '@/components/ui/input'; // Added
// import { DatePicker } from '@/components/ui/date-picker'; // Assuming a date picker component exists or use Input type="date"

// Type for user profile, assuming metadata structure
type UserProfileWithChildren = {
    id: string;
    full_name: string;
    metadata?: {
        children_ids?: string[];
    }
};

// Type for fetched exemption data
type ExemptionQueryResult = {
  id: string;
  child_id: string;
  reason: string;
  start_date: string;
  end_date: string;
  medical_document_url?: string | null;
  status: 'submitted' | 'approved' | 'rejected'; // Use enum type if defined in DB
  submitted_at?: string | null;
  child: { full_name: string } | null; // Joined data
};

type SportsExemption = {
  id: string;
  child_id: string;
  child_name: string;
  reason: string;
  start_date: string;
  end_date: string;
  medical_document_url?: string | null;
  status: 'submitted' | 'approved' | 'rejected';
  submitted_at?: string | null;
};

export default function ParentSportsExemptionsPage() {
  const [myExemptions, setMyExemptions] = useState<SportsExemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExemptionForm, setShowExemptionForm] = useState(false);
  // Form state
  const [newExemptionChildId, setNewExemptionChildId] = useState<string>('');
  const [newExemptionReason, setNewExemptionReason] = useState<string>('');
  const [newExemptionStartDate, setNewExemptionStartDate] = useState<string>('');
  const [newExemptionEndDate, setNewExemptionEndDate] = useState<string>('');
  const [newExemptionFileUrl, setNewExemptionFileUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfileWithChildren | null>(null);
  const [childrenList, setChildrenList] = useState<{id: string, name: string}[]>([]);

  const fetchExemptions = useCallback(async (parentId: string) => {
     if (!parentId) {
        setMyExemptions([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('sports_exemptions')
      .select(`
        *,
        child:child_id(full_name)
      `)
      .eq('parent_id', parentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching exemptions:', error);
      setMyExemptions([]);
    } else if (data) {
       const formattedExemptions = (data as ExemptionQueryResult[]).map(e => {
           let childName = 'Unknown Child';
           if (e.child && typeof e.child === 'object' && !Array.isArray(e.child) && 'full_name' in e.child) {
               childName = (e.child as { full_name: string }).full_name || childName;
           } else {
               childName = childrenList.find(c => c.id === e.child_id)?.name || childName;
           }
           return {
                id: e.id,
                child_id: e.child_id,
                child_name: childName,
                reason: e.reason,
                start_date: e.start_date,
                end_date: e.end_date,
                medical_document_url: e.medical_document_url,
                status: e.status,
                submitted_at: e.submitted_at,
           };
       });
      setMyExemptions(formattedExemptions);
    }
    setLoading(false);
  }, [childrenList]); // Depend on childrenList for name fallback

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
        // Fetch children
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
        // Fetch existing exemptions (fetchExemptions depends on childrenList via useCallback)
        fetchExemptions(profile.id);
      } else {
          setLoading(false);
      }
    };
    init();
  }, [fetchExemptions]); // Run init once, fetchExemptions will run when childrenList updates

  const handleExemptionFileUploadComplete = (fileUrl: string) => {
    setNewExemptionFileUrl(fileUrl);
  };

  const resetForm = () => {
      setNewExemptionChildId('');
      setNewExemptionReason('');
      setNewExemptionStartDate('');
      setNewExemptionEndDate('');
      setNewExemptionFileUrl(null);
      setShowExemptionForm(false);
  };

  const handleSubmitExemption = async () => {
    if (!currentUser?.id || !newExemptionChildId || !newExemptionReason || !newExemptionStartDate || !newExemptionEndDate) {
      alert('Please select child, provide reason, start date, and end date.');
      return;
    }
    // Basic date validation
    if (new Date(newExemptionEndDate) < new Date(newExemptionStartDate)) {
        alert('End date cannot be before start date.');
        return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.from('sports_exemptions').insert([{
      parent_id: currentUser.id,
      child_id: newExemptionChildId,
      reason: newExemptionReason,
      start_date: newExemptionStartDate,
      end_date: newExemptionEndDate,
      medical_document_url: newExemptionFileUrl || null,
      status: 'submitted',
    }]).select();

    if (error) {
      console.error("Error submitting exemption:", error);
      alert(`Error submitting exemption: ${error.message}`);
    } else {
      alert('Sports exemption request submitted successfully.');
      resetForm();
      // Refresh list
      if (currentUser?.id) {
          fetchExemptions(currentUser.id);
      }
    }
    setIsSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'submitted': return 'text-blue-600 bg-blue-100';
        case 'approved': return 'text-green-600 bg-green-100';
        case 'rejected': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
    }
  };

  const sportsExemptionDeadline = "2025-08-15"; // Example deadline

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sports Exemption Requests</h1>
        <Button onClick={() => setShowExemptionForm(true)}>Request New Exemption</Button>
      </div>

      <Card className="bg-yellow-50 border-yellow-300">
        <CardHeader>
          <CardTitle className="text-yellow-700">Important: Sports Exemption Deadline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            The deadline to submit sports exemption requests for the upcoming academic year is
            <strong> {new Date(sportsExemptionDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            Please ensure all requests, along with any required medical documentation, are submitted by this date.
          </p>
        </CardContent>
      </Card>

      {showExemptionForm && currentUser && (
        <Card>
          <CardHeader><CardTitle>New Sports Exemption Request</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div>
              <Label htmlFor="exemptionChildSelect">Select Child *</Label>
              <Select onValueChange={setNewExemptionChildId} value={newExemptionChildId} required>
                <SelectTrigger id="exemptionChildSelect"><SelectValue placeholder="Select your child" /></SelectTrigger>
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
                    <Label htmlFor="exemptionStartDate">Start Date *</Label>
                    <Input id="exemptionStartDate" type="date" value={newExemptionStartDate} onChange={e => setNewExemptionStartDate(e.target.value)} required />
                 </div>
                 <div>
                    <Label htmlFor="exemptionEndDate">End Date *</Label>
                    <Input id="exemptionEndDate" type="date" value={newExemptionEndDate} onChange={e => setNewExemptionEndDate(e.target.value)} required />
                 </div>
             </div>
            <div>
              <Label htmlFor="exemptionReason">Reason for Exemption *</Label>
              <Textarea id="exemptionReason" value={newExemptionReason} onChange={e => setNewExemptionReason(e.target.value)} required placeholder="Please provide a brief reason for the exemption request..." rows={3} />
            </div>
            <div>
              <Label>Upload Medical Note (Optional)</Label>
              <FileUploader
                bucket="documents" // Specify your bucket name
                folder="exemptions" // Folder for exemption docs
                userId={currentUser.id}
                documentType="sports_exemption_note"
                onUploadComplete={handleExemptionFileUploadComplete}
                allowedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
                maxSizeMB={5}
              />
              {newExemptionFileUrl && <p className="text-sm text-green-600 mt-1">Document selected for upload.</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmitExemption} disabled={isSubmitting || !newExemptionChildId || !newExemptionReason || !newExemptionStartDate || !newExemptionEndDate}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button variant="ghost" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Submitted Exemption Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading requests...</p>}
          {!loading && myExemptions.length === 0 && <p>You have not submitted any sports exemption requests.</p>}
          {!loading && myExemptions.length > 0 && (
            <ul className="mt-4 space-y-3">
              {myExemptions.map(exemption => (
                <li key={exemption.id} className="p-3 border rounded-md">
                  For <strong>{exemption.child_name}</strong>
                  <p className="text-sm">Reason: {exemption.reason}</p>
                  <p className="text-xs text-gray-500">
                    Period: {new Date(exemption.start_date).toLocaleDateString()} - {new Date(exemption.end_date).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {exemption.submitted_at && `Submitted: ${new Date(exemption.submitted_at).toLocaleDateString()}`}
                    </p>
                     <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(exemption.status)}`}>
                        {exemption.status.toUpperCase()}
                    </span>
                  </div>
                  {exemption.medical_document_url &&
                    <Button variant="link" size="sm" asChild className="px-0 h-auto py-1"><a href={exemption.medical_document_url} target="_blank" rel="noopener noreferrer">View Medical Note</a></Button>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}