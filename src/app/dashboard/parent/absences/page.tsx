'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
// import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Keep commented for now, using list view
import FileUploader from '@/components/FileUploader'; // Uncommented

// Define types
type StudentInfoFromDB = {
    full_name: string;
};

type ClassInfoFromDB = {
    name: string;
};

// Type for the raw result, acknowledging potential array/object ambiguity from TS inference
type AbsenceQueryResult = {
    id: string;
    student_id: string;
    class_id?: string | null;
    date: string;
    justified: boolean;
    justification_document_url?: string | null;
    student: unknown; // Use unknown for joined data initially
    class: unknown;   // Use unknown for joined data initially
};

type ChildAbsence = {
  id: string; // absence id
  student_id: string;
  student_name: string; // Processed name
  class_id?: string | null;
  class_name: string; // Processed name
  date: string;
  justified: boolean;
  justification_document_url?: string | null;
};

// Type for user profile, assuming metadata structure
type UserProfileWithChildren = {
    id: string;
    full_name: string;
    metadata?: {
        children_ids?: string[]; // Assuming parent profile has this in metadata
    }
    // other profile fields...
};


export default function ParentAbsencesPage() {
  const [childAbsences, setChildAbsences] = useState<ChildAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbsenceForJustification, setSelectedAbsenceForJustification] = useState<ChildAbsence | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfileWithChildren | null>(null); // Use specific type


  const fetchAbsences = useCallback(async (childrenIds: string[]) => {
    if (!childrenIds || childrenIds.length === 0) {
        setChildAbsences([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    // Fetch absences for linked children, joining student and class names
    const { data, error } = await supabase
      .from('absences')
      .select(`
        id,
        student_id,
        class_id,
        date,
        justified,
        justification_document_url,
        student:users!absences_student_id_fkey(full_name),
        class:classes!absences_class_id_fkey(name)
      `)
      .in('student_id', childrenIds)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching child absences:', error);
      setChildAbsences([]); // Clear on error
    } else if (data) {
      // Format data with robust type checking for joined fields
      const formattedAbsences = (data as AbsenceQueryResult[]).map(a => {
        // Check student data
        let studentName = 'Unknown Student';
        if (a.student && typeof a.student === 'object' && !Array.isArray(a.student) && 'full_name' in a.student) {
            studentName = (a.student as StudentInfoFromDB).full_name || studentName;
        }

        // Check class data
        let className = 'N/A';
        if (a.class && typeof a.class === 'object' && !Array.isArray(a.class) && 'name' in a.class) {
            className = (a.class as ClassInfoFromDB).name || className;
        }

        return {
          id: a.id,
          student_id: a.student_id,
          student_name: studentName,
          class_id: a.class_id,
          class_name: className,
          date: a.date,
          justified: a.justified,
          justification_document_url: a.justification_document_url,
        };
      });
      setChildAbsences(formattedAbsences);
    }
    setLoading(false);
  }, []); // Empty dependency array for useCallback

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
          setLoading(false);
          // Redirect?
          return;
      }

      // Fetch parent profile, assuming it includes children_ids in metadata
      // Cast to the specific type after fetching
      const profile = await getUserProfile(session.user.id) as UserProfileWithChildren | null;
      setCurrentUser(profile);

      const childrenIds = profile?.metadata?.children_ids;
      if (childrenIds && Array.isArray(childrenIds) && childrenIds.length > 0) {
          fetchAbsences(childrenIds);
      } else {
          console.log("No children IDs found in parent profile metadata or profile is null.");
          setChildAbsences([]); // Ensure it's empty if no children
          setLoading(false);
      }
    };
    init();
  }, [fetchAbsences]); // Include fetchAbsences in dependency array

  const handleFileUploadComplete = async (fileUrl: string, fileMetadata: any) => {
    if (!selectedAbsenceForJustification) return;

    setLoading(true); // Indicate activity
    // Update absence record with justification_document_url
    // Optionally set justified = true or add a status like 'pending_review'
    const { error } = await supabase
        .from('absences')
        .update({
            justification_document_url: fileUrl,
            justified: true // Or set a specific status if review is needed
            // Optionally update metadata with review status if applicable
            // metadata: { ...selectedAbsenceForJustification.metadata, justification_status: 'pending_review' }
        })
        .eq('id', selectedAbsenceForJustification.id);

    if (error) {
        console.error("Error updating justification:", error);
        alert(`Failed to submit justification: ${error.message}`);
    } else {
        alert(`Justification uploaded successfully for ${selectedAbsenceForJustification.student_name} on ${new Date(selectedAbsenceForJustification.date).toLocaleDateString()}`);
        // Refresh the list to show updated status
        if (currentUser?.metadata?.children_ids) {
            fetchAbsences(currentUser.metadata.children_ids);
        }
        setSelectedAbsenceForJustification(null); // Close the uploader form
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Child's Absences</h1>

      <Card>
        <CardHeader>
          <CardTitle>Absence Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading absences...</p>}
          {!loading && childAbsences.length === 0 && <p>No absences recorded for your child(ren).</p>}
          {!loading && childAbsences.length > 0 && (
            <ul className="mt-4 space-y-3">
              {childAbsences.map(absence => (
                <li key={absence.id} className="p-3 border rounded-md">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <strong>{absence.student_name}</strong> - {absence.class_name || 'N/A'}
                      <p className="text-sm">Date: {new Date(absence.date).toLocaleDateString()}</p>
                      <p className={`text-sm font-semibold ${absence.justified ? 'text-green-600' : 'text-red-600'}`}>
                        Status: {absence.justified ? 'Justified' : 'Not Justified'}
                      </p>
                      {/* Display reason if available */}
                    </div>
                    <div className="flex-shrink-0 mt-2 sm:mt-0">
                      {absence.justification_document_url ? (
                        <Button variant="link" size="sm" asChild>
                            <a href={absence.justification_document_url} target="_blank" rel="noopener noreferrer">View Justification</a>
                        </Button>
                      ) : !absence.justified ? (
                        <Button size="sm" onClick={() => setSelectedAbsenceForJustification(absence)}>Upload Justification</Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Justification Upload Section */}
      {selectedAbsenceForJustification && currentUser && ( // Ensure currentUser exists for userId prop
        <Card>
          <CardHeader>
            <CardTitle>Upload Justification for {selectedAbsenceForJustification.student_name} ({new Date(selectedAbsenceForJustification.date).toLocaleDateString()})</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader
              bucket="documents" // Specify your bucket name
              folder="justifications" // Specify folder within the bucket
              userId={currentUser.id} // Pass parent's user ID
              documentType="absence_justification" // Define a type for this document
              onUploadComplete={handleFileUploadComplete} // Use the correct prop name
              allowedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
              maxSizeMB={5}
              // storagePath prop is not needed as FileUploader constructs its own path
            />
            <Button variant="ghost" onClick={() => setSelectedAbsenceForJustification(null)} className="mt-2">Cancel</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}