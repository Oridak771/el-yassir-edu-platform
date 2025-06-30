'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase'; // Uncommented
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Uncommented Table components
import { Badge } from '@/components/ui/badge'; // For status

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

type AbsenceRecord = {
  id: string; // absence id
  student_id: string;
  student_name: string; // Processed name
  class_id?: string | null;
  class_name: string; // Processed name
  date: string;
  justified: boolean;
  justification_document_url?: string | null;
};


export default function AdminAbsencesPage() {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  // Add state for filtering/pagination if needed later

  const fetchAbsences = useCallback(async () => {
    setLoading(true);
    // Fetch all absences (or recent ones), joining student and class names
    // Admins typically have broader access via RLS policies
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
      .order('date', { ascending: false })
      .limit(100); // Limit initial fetch for performance

    if (error) {
      console.error('Error fetching absences:', error);
      setAbsences([]);
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
      setAbsences(formattedAbsences);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  // Optional: Function to mark an absence as justified (if admin needs this power)
  const markAsJustified = async (absenceId: string) => {
      const { error } = await supabase
          .from('absences')
          .update({ justified: true })
          .eq('id', absenceId);

      if (error) {
          alert(`Error updating absence: ${error.message}`);
      } else {
          alert('Absence marked as justified.');
          fetchAbsences(); // Refresh list
      }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Absence Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Absences</CardTitle>
          {/* Add Filters/Search here later */}
        </CardHeader>
        <CardContent>
          {loading && <p>Loading absences...</p>}
          {!loading && absences.length === 0 && <p>No absences recorded recently.</p>}
          {!loading && absences.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Student</TableHeaderCell>
                  <TableHeaderCell>Class</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {absences.map((absence) => (
                  <TableRow key={absence.id}>
                    <TableCell>{absence.student_name}</TableCell>
                    <TableCell>{absence.class_name}</TableCell>
                    <TableCell>{new Date(absence.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <Badge variant={absence.justified ? 'default' : 'secondary'}>
                            {absence.justified ? 'Justified' : 'Not Justified'}
                        </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 rtl:space-x-reverse">
                      {absence.justification_document_url ? (
                        <Button variant="outline" size="sm" asChild>
                            <a href={absence.justification_document_url} target="_blank" rel="noopener noreferrer">View Justification</a>
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">No Justification</span>
                      )}
                      {/* Optionally add button to mark justified if needed */}
                      {/* {!absence.justified && (
                          <Button variant="secondary" size="sm" onClick={() => markAsJustified(absence.id)}>Mark Justified</Button>
                      )} */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {/* Add Pagination controls here later */}
        </CardContent>
      </Card>

      {/* Keep other cards as placeholders for now */}
      <Card>
        <CardHeader>
          <CardTitle>Absence Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Placeholder for managing absence notification settings or viewing a log of sent notifications.</p>
        </CardContent>
      </Card>

    </div>
  );
}