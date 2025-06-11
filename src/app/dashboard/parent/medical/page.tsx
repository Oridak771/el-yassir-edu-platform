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

// Type for user profile, assuming metadata structure
type UserProfileWithChildren = {
    id: string;
    full_name: string;
    metadata?: {
        children_ids?: string[];
    }
};

// Type for fetched medical record data
type MedicalRecordQueryResult = {
  id: string;
  child_id: string;
  record_type: 'vaccination' | 'medical_visit' | 'allergy_info' | 'medical_certificate' | 'other';
  description: string;
  record_date: string;
  document_url?: string | null;
  next_due_date?: string | null;
  child: { full_name: string } | null; // Joined data
};

type MedicalRecord = {
  id: string;
  child_id: string;
  child_name: string;
  record_type: 'vaccination' | 'medical_visit' | 'allergy_info' | 'medical_certificate' | 'other';
  description: string;
  record_date: string;
  document_url?: string | null;
  next_due_date?: string | null;
};

export default function ParentMedicalPage() {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfileWithChildren | null>(null);
  const [childrenList, setChildrenList] = useState<{id: string, name: string}[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for the new record form
  const [newRecordChildId, setNewRecordChildId] = useState<string>('');
  const [newRecordType, setNewRecordType] = useState<string>('medical_visit');
  const [newRecordDescription, setNewRecordDescription] = useState<string>('');
  const [newRecordDate, setNewRecordDate] = useState<string>('');
  const [newRecordNextDueDate, setNewRecordNextDueDate] = useState<string>(''); // Optional
  const [newRecordFileUrl, setNewRecordFileUrl] = useState<string | null>(null);


  const fetchMedicalRecords = useCallback(async (childrenIds: string[]) => {
    if (!childrenIds || childrenIds.length === 0) {
        setMedicalRecords([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        child:child_id(full_name)
      `)
      .in('child_id', childrenIds)
      .order('record_date', { ascending: false });

    if (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecords([]);
    } else if (data) {
      const formattedRecords = (data as MedicalRecordQueryResult[]).map(r => {
          let childName = 'Unknown Child';
          if (r.child && typeof r.child === 'object' && !Array.isArray(r.child) && 'full_name' in r.child) {
              childName = (r.child as { full_name: string }).full_name || childName;
          } else {
              // Fallback to map if needed (though should be joined)
              childName = childrenList.find(c => c.id === r.child_id)?.name || childName;
          }
          return {
            id: r.id,
            child_id: r.child_id,
            child_name: childName,
            record_type: r.record_type,
            description: r.description,
            record_date: r.record_date,
            document_url: r.document_url,
            next_due_date: r.next_due_date,
          };
      });
      setMedicalRecords(formattedRecords);
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

      const childrenIds = profile?.metadata?.children_ids;
      if (profile && childrenIds && Array.isArray(childrenIds) && childrenIds.length > 0) {
        // Fetch children names for select dropdown
        const { data: childrenData, error: childrenError } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', childrenIds);

        if (childrenError) {
            console.error("Error fetching children names:", childrenError);
            setChildrenList([]); // Set empty on error
        } else if (childrenData) {
            setChildrenList(childrenData.map(c => ({id: c.id, name: c.full_name})));
        }
        // Fetch records after setting children list (or pass map to fetch)
        fetchMedicalRecords(childrenIds);
      } else {
          console.log("No children found for parent or profile missing.");
          setMedicalRecords([]);
          setLoading(false);
      }
    };
    init();
  }, [fetchMedicalRecords]);

  const handleFileUploadComplete = (fileUrl: string) => {
    setNewRecordFileUrl(fileUrl);
  };

  const resetForm = () => {
      setNewRecordChildId('');
      setNewRecordType('medical_visit');
      setNewRecordDescription('');
      setNewRecordDate('');
      setNewRecordNextDueDate('');
      setNewRecordFileUrl(null);
      setShowUploadForm(false);
  };

  const handleSubmitRecord = async () => {
    if (!currentUser?.id || !newRecordChildId || !newRecordType || !newRecordDescription || !newRecordDate) {
        alert('Please select child, record type, enter description, and record date.');
        return;
    }
    setIsSubmitting(true);

    const { data, error } = await supabase.from('medical_records').insert([{
        parent_id: currentUser.id, // Set parent_id
        child_id: newRecordChildId,
        record_type: newRecordType,
        description: newRecordDescription,
        record_date: newRecordDate,
        document_url: newRecordFileUrl || null,
        next_due_date: newRecordNextDueDate || null,
    }]).select();

    if (error) {
        console.error("Error submitting medical record:", error);
        alert(`Error submitting record: ${error.message}`);
    } else {
        alert('Medical record added successfully!');
        resetForm();
        // Refresh list
        if (currentUser?.metadata?.children_ids) {
            fetchMedicalRecords(currentUser.metadata.children_ids);
        }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Child Medical Information</h1>
        <Button onClick={() => setShowUploadForm(true)}>Add Medical Record</Button>
      </div>

      {showUploadForm && currentUser && (
        <Card>
          <CardHeader><CardTitle>Add New Medical Record</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="medChildSelect">Select Child *</Label>
              <Select onValueChange={setNewRecordChildId} value={newRecordChildId} required>
                <SelectTrigger id="medChildSelect"><SelectValue placeholder="Select your child" /></SelectTrigger>
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
              <Label htmlFor="medRecordType">Record Type *</Label>
              <Select onValueChange={setNewRecordType} value={newRecordType} required>
                <SelectTrigger id="medRecordType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="medical_visit">Medical Visit</SelectItem>
                  <SelectItem value="allergy_info">Allergy Info</SelectItem>
                  <SelectItem value="medical_certificate">Medical Certificate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="medRecordDate">Record Date *</Label>
              <Input id="medRecordDate" type="date" value={newRecordDate} onChange={e => setNewRecordDate(e.target.value)} required />
            </div>
             {newRecordType === 'vaccination' && (
                 <div>
                    <Label htmlFor="medNextDueDate">Next Due Date (Optional)</Label>
                    <Input id="medNextDueDate" type="date" value={newRecordNextDueDate} onChange={e => setNewRecordNextDueDate(e.target.value)} />
                 </div>
             )}
            <div>
              <Label htmlFor="medDescription">Description / Details *</Label>
              <Textarea id="medDescription" value={newRecordDescription} onChange={e => setNewRecordDescription(e.target.value)} required placeholder="e.g., MMR Vaccine (2nd dose), Annual Check-up, Peanut Allergy..." />
            </div>
            <div>
              <Label>Upload Supporting Document (Optional)</Label>
              <FileUploader
                bucket="documents" // Specify your bucket name
                folder="medical_records" // Folder for medical docs
                userId={currentUser.id}
                documentType="medical_record" // Or more specific based on record_type
                onUploadComplete={handleFileUploadComplete}
                allowedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
                maxSizeMB={5}
              />
              {newRecordFileUrl && <p className="text-sm text-green-600 mt-1">Document selected for upload.</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmitRecord} disabled={isSubmitting || !newRecordChildId || !newRecordType || !newRecordDescription || !newRecordDate}>
                {isSubmitting ? 'Saving...' : 'Save Record'}
              </Button>
              <Button variant="ghost" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Medical & Vaccination Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            View and manage medical visit notifications, vaccination records, and other health-related documents for your child(ren).
          </p>
           {loading && <p>Loading records...</p>}
           {!loading && medicalRecords.length === 0 && <p>No medical records found for your child(ren).</p>}
           {!loading && medicalRecords.length > 0 && (
              <ul className="mt-4 space-y-3">
                {medicalRecords.map(record => (
                  <li key={record.id} className="p-3 border rounded-md">
                    <strong>{record.child_name}</strong> - <span className="capitalize">{record.record_type.replace('_', ' ')}</span>
                    <p className="text-sm">Description: {record.description}</p>
                    <p className="text-xs text-gray-500">Date: {new Date(record.record_date).toLocaleDateString()}</p>
                    {record.next_due_date && <p className="text-xs text-orange-600">Next Due: {new Date(record.next_due_date).toLocaleDateString()}</p>}
                    {record.document_url && <Button variant="link" size="sm" asChild className="px-0 h-auto py-1"><a href={record.document_url} target="_blank" rel="noopener noreferrer">View Document</a></Button>}
                    {/* TODO: Add Edit/Delete buttons? Requires RLS setup */}
                  </li>
                ))}
              </ul>
           )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>School Medical Visit Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Notifications about upcoming school medical visits or health checks will appear here.</p>
          {/* TODO: Fetch and display relevant notifications from 'notifications' table */}
          <p className="text-gray-500 mt-2">No upcoming school medical visit notifications.</p>
        </CardContent>
      </Card>
    </div>
  );
}