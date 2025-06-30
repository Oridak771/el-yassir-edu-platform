'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
// import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Using list view
import Chart from '@/components/Chart'; // Uncommented
import PDFGenerator, { type PDFField } from '@/components/PDFGenerator'; // Uncommented

// Type for user profile, assuming metadata structure
type UserProfileWithChildren = {
    id: string;
    full_name: string;
    metadata?: {
        children_ids?: string[];
    }
};

// Type for joined student data
type StudentInfoFromDB = {
    full_name: string;
};

// Type for fetched grade data
type GradeQueryResult = {
    id: string;
    student_id: string;
    subject: string;
    assignment_name: string;
    score: number;
    total_possible: number;
    date: string;
    comments?: string | null;
    student: unknown; // Use unknown for joined data initially
};

type ChildGrade = {
  id: string;
  child_name: string;
  child_id: string;
  subject: string;
  assignment_name: string;
  score: number;
  total_possible: number;
  date: string;
  teacher_comments?: string | null;
};

// Type for fetched bulletin data (assuming stored in documents)
type BulletinDocument = {
  id: string;
  owner_id: string; // Should be child's ID
  name: string; // e.g., "Bulletin Term 1 2024-2025"
  url: string;
  created_at: string;
  metadata?: { // Optional metadata for term, year etc.
    term?: string;
    academic_year?: string;
    child_name?: string; // Could store child name here too
  }
};

type Bulletin = {
  id: string;
  child_id: string;
  child_name: string; // Get from metadata or fetch separately
  term: string; // Get from metadata or parse from name
  download_url: string;
  generation_date: string;
};

export default function ParentGradesPage() {
  const [childGrades, setChildGrades] = useState<ChildGrade[]>([]);
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingBulletins, setLoadingBulletins] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfileWithChildren | null>(null);
  const [childrenInfo, setChildrenInfo] = useState<Map<string, string>>(new Map()); // Map child ID to name

  const fetchParentData = useCallback(async () => {
    setLoadingGrades(true);
    setLoadingBulletins(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        setLoadingGrades(false);
        setLoadingBulletins(false);
        // Redirect?
        return;
    }

    const profile = await getUserProfile(session.user.id) as UserProfileWithChildren | null;
    setCurrentUser(profile);

    const childrenIds = profile?.metadata?.children_ids;
    if (!childrenIds || !Array.isArray(childrenIds) || childrenIds.length === 0) {
        console.log("No children IDs found for parent.");
        setLoadingGrades(false);
        setLoadingBulletins(false);
        return;
    }

    // Fetch children names for mapping later
    const { data: childrenData, error: childrenError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', childrenIds);

    let childrenNameMap = new Map<string, string>();
    if (childrenError) {
        console.error("Error fetching children names:", childrenError);
    } else if (childrenData) {
        childrenNameMap = new Map(childrenData.map(c => [c.id, c.full_name]));
        setChildrenInfo(childrenNameMap); // Set state if needed elsewhere
    }


    // Fetch grades
    const { data: gradesData, error: gradesError } = await supabase
      .from('grades')
      .select(`
        id, student_id, subject, assignment_name, score, total_possible, date, comments,
        student:student_id(full_name)
      `)
      .in('student_id', childrenIds)
      .order('date', { ascending: false });

    if (gradesError) {
      console.error('Error fetching grades:', gradesError);
    } else if (gradesData) {
      // Format data with robust type checking for joined student field
      const formattedGrades = (gradesData as GradeQueryResult[]).map(g => {
          let studentName = 'Unknown Child';
          // Check if student data is a valid object
          if (g.student && typeof g.student === 'object' && !Array.isArray(g.student) && 'full_name' in g.student) {
              studentName = (g.student as StudentInfoFromDB).full_name || studentName;
          } else {
              // Fallback to map if join failed or was null
              studentName = childrenNameMap.get(g.student_id) || studentName;
          }

          return {
            id: g.id,
            child_id: g.student_id,
            child_name: studentName,
            subject: g.subject,
            assignment_name: g.assignment_name,
            score: g.score,
            total_possible: g.total_possible,
            date: g.date,
            teacher_comments: g.comments,
          };
      });
      setChildGrades(formattedGrades);
    }
    setLoadingGrades(false);

    // Fetch bulletins
    const { data: bulletinsData, error: bulletinsError } = await supabase
      .from('documents')
      .select('*')
      .in('owner_id', childrenIds) // Assuming owner_id is the child's ID
      .eq('type', 'bulletin') // Filter by document type
      .order('created_at', { ascending: false });

    if (bulletinsError) {
      console.error('Error fetching bulletins:', bulletinsError);
    } else if (bulletinsData) {
        const formattedBulletins = (bulletinsData as BulletinDocument[]).map(b => ({
            id: b.id,
            child_id: b.owner_id,
            child_name: b.metadata?.child_name ?? childrenNameMap.get(b.owner_id) ?? 'Unknown Child',
            term: b.metadata?.term ?? b.name, // Get term from metadata or parse name
            download_url: b.url,
            generation_date: b.created_at,
        }));
      setBulletins(formattedBulletins);
    }
    setLoadingBulletins(false);

  }, []); // Removed childrenInfo dependency, map is created inside

  useEffect(() => {
    fetchParentData();
  }, [fetchParentData]);


  // Placeholder for PDF generation fields if needed
  // const bulletinPdfFields = (bulletinData: any): PDFField[] => { /* ... define fields based on bulletinData ... */ return []; };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Child's Grades & Bulletins</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Grades</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGrades && <p>Loading grades...</p>}
          {!loadingGrades && childGrades.length === 0 && <p>No grades posted recently for your child(ren).</p>}
          {!loadingGrades && childGrades.length > 0 && (
            <ul className="mt-4 space-y-3">
              {childGrades.map(grade => (
                <li key={grade.id} className="p-3 border rounded-md">
                  <strong>{grade.child_name}</strong> - {grade.subject} - {grade.assignment_name}
                  <p>Score: {grade.score}/{grade.total_possible} ({ (grade.score / grade.total_possible * 100).toFixed(1) }%)</p>
                  <p className="text-sm text-gray-500">Date: {new Date(grade.date).toLocaleDateString()}</p>
                  {grade.teacher_comments && <p className="text-xs italic text-gray-600">Comment: {grade.teacher_comments}</p>}
                </li>
              ))}
            </ul>
          )}
          {/* TODO: Add Chart component for grade trends or distribution */}
          {/* {!loadingGrades && childGrades.length > 0 && <Chart ... />} */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Downloadable Bulletins (Report Cards)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBulletins && <p>Loading bulletins...</p>}
          {!loadingBulletins && bulletins.length === 0 && <p>No bulletins available for download.</p>}
          {!loadingBulletins && bulletins.length > 0 && (
            <ul className="mt-4 space-y-2">
              {bulletins.map(bulletin => (
                <li key={bulletin.id} className="p-3 border rounded-md flex justify-between items-center">
                  <div>
                    <strong>{bulletin.term}</strong> for {bulletin.child_name}
                    <p className="text-sm text-gray-500">Generated: {new Date(bulletin.generation_date).toLocaleDateString()}</p>
                  </div>
                  {bulletin.download_url ?
                    <Button asChild><a href={bulletin.download_url} download target="_blank" rel="noopener noreferrer">Download PDF</a></Button> :
                    <Button disabled>Not Available</Button>
                    // Or use PDFGenerator if bulletins are generated on-the-fly:
                    // <PDFGenerator title={`Bulletin ${bulletin.term}`} filename={`bulletin_${bulletin.child_id}_${bulletin.term}.pdf`} fields={bulletinPdfFields(bulletin)} />
                  }
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reevaluation Notices</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Notifications regarding grade reevaluations or corrections will appear here.</p>
          {/* TODO: Fetch and display reevaluation notices from 'notifications' table */}
          <p className="text-gray-500 mt-2">No reevaluation notices at this time.</p>
        </CardContent>
      </Card>
    </div>
  );
}