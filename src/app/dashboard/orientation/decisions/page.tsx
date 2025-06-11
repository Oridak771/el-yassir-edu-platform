'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import PDFGenerator, { type PDFField } from '@/components/PDFGenerator'; // Uncommented
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Using Table
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'; // For PDF preview/generation

// Type for joined data
type StudentInfoFromDB = { full_name: string; };
type FormInfoFromDB = { title: string; };
type DeciderInfoFromDB = { full_name: string; };

// Type for fetched orientation response data
type OrientationResponseQueryResult = {
  id: string; // response_id
  student_id: string;
  decision?: string | null;
  decision_date?: string | null;
  decision_by?: string | null; // UUID of decider
  form_id: string;
  student: unknown; // Use unknown for joined data initially
  form: unknown;    // Use unknown for joined data initially
  decider: unknown; // Use unknown for joined data initially
};

type OrientationDecision = {
  id: string; // response_id
  student_id: string;
  student_name: string;
  form_id: string;
  form_title: string;
  decision: string;
  decision_date: string;
  decision_by_name: string;
};

export default function OrientationDecisionsPage() {
  const [decisions, setDecisions] = useState<OrientationDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null); // Store current user for fallback decider name
  const [selectedDecisionForPdf, setSelectedDecisionForPdf] = useState<OrientationDecision | null>(null);
  const [pdfFields, setPdfFields] = useState<PDFField[]>([]);
  const [pdfFilename, setPdfFilename] = useState<string>('orientation_decision.pdf');
  const [showPdfDialog, setShowPdfDialog] = useState(false);


  const fetchDecisions = useCallback(async () => {
    setLoading(true);
    const { data: authUser } = await supabase.auth.getUser();
    if (authUser.user) {
        // const profile = await getUserProfile(authUser.user.id); // Not strictly needed for this page's core logic
        // setCurrentUser(profile);
    }

    const { data, error } = await supabase
      .from('orientation_responses')
      .select(`
        id, student_id, decision, decision_date, decision_by, form_id,
        student:student_id(full_name),
        form:form_id(title),
        decider:decision_by(full_name)
      `)
      .not('decision', 'is', null) // Only where a decision has been made
      // Admins/Orientation Supervisors should see all decisions
      .order('decision_date', { ascending: false })
      .limit(100); // Add limit for performance

    if (error) {
      console.error('Error fetching decisions:', error);
      setDecisions([]);
    } else if (data) {
      const formattedDecisions = (data as OrientationResponseQueryResult[]).map(d => {
        let studentName = 'Unknown Student';
        if (d.student && typeof d.student === 'object' && !Array.isArray(d.student) && 'full_name' in d.student) {
            studentName = (d.student as StudentInfoFromDB).full_name || studentName;
        }
        let formTitle = 'Unknown Form';
        if (d.form && typeof d.form === 'object' && !Array.isArray(d.form) && 'title' in d.form) {
            formTitle = (d.form as FormInfoFromDB).title || formTitle;
        }
        let deciderName = 'System';
        if (d.decider && typeof d.decider === 'object' && !Array.isArray(d.decider) && 'full_name' in d.decider) {
            deciderName = (d.decider as DeciderInfoFromDB).full_name || deciderName;
        }

        return {
            id: d.id,
            student_id: d.student_id,
            student_name: studentName,
            form_id: d.form_id,
            form_title: formTitle,
            decision: d.decision ?? 'N/A',
            decision_date: d.decision_date ?? new Date().toISOString(),
            decision_by_name: deciderName,
        };
      });
      setDecisions(formattedDecisions);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  const generateDecisionPdfFields = (decision: OrientationDecision): PDFField[] => {
    return [
      { name: "School Name", value: "El Yassir Educational Platform", x: 50, y: 780, font: 'Helvetica-Bold', size: 20 },
      { name: "Document Title", value: "Official Orientation Decision", x: 50, y: 740, font: 'Helvetica-Bold', size: 16 },
      { name: "Date Issued", value: `Date: ${new Date().toLocaleDateString()}`, x: 400, y: 740, size: 10 },
      { name: "Separator1", value: "_".repeat(80), x: 50, y: 720, size: 10},

      { name: "Student Name Label", value: "Student Name:", x: 50, y: 680, font: 'Helvetica-Bold', size: 12 },
      { name: "Student Name Value", value: decision.student_name, x: 150, y: 680, size: 12 },

      { name: "Form Title Label", value: "Questionnaire:", x: 50, y: 660, font: 'Helvetica-Bold', size: 12 },
      { name: "Form Title Value", value: decision.form_title, x: 150, y: 660, size: 12 },

      { name: "Decision Date Label", value: "Decision Date:", x: 50, y: 640, font: 'Helvetica-Bold', size: 12 },
      { name: "Decision Date Value", value: new Date(decision.decision_date).toLocaleDateString(), x: 150, y: 640, size: 12 },

      { name: "Decision Label", value: "Decision:", x: 50, y: 600, font: 'Helvetica-Bold', size: 14 },
      { name: "Decision Value", value: decision.decision, x: 50, y: 570, font: 'Helvetica-Bold', size: 14, },

      { name: "Comments Label", value: "Comments/Notes:", x: 50, y: 530, font: 'Helvetica-Bold', size: 12 },
      { name: "Comments Value", value: "Based on the submitted questionnaire and internal review, the above decision has been made. Please contact the orientation office for any clarifications.", x: 50, y: 510, size: 10 }, // Placeholder comments

      { name: "Separator2", value: "_".repeat(80), x: 50, y: 150, size: 10},
      { name: "Decided By Label", value: "Decided By:", x: 50, y: 120, font: 'Helvetica-Bold', size: 10 },
      { name: "Decided By Value", value: decision.decision_by_name, x: 150, y: 120, size: 10 },
      { name: "School Contact", value: "Orientation Office, El Yassir Edu Platform", x: 50, y: 80, size: 9 },
    ];
  };

  const handleGeneratePdfClick = (decision: OrientationDecision) => {
    setSelectedDecisionForPdf(decision);
    setPdfFields(generateDecisionPdfFields(decision));
    setPdfFilename(`Orientation_Decision_${decision.student_name.replace(/\s+/g, '_')}_${decision.id.substring(0,6)}.pdf`);
    setShowPdfDialog(true);
  };

  const handlePdfGenerated = (url: string, pdfBytes: Uint8Array) => {
    // Optional: Save the generated PDF to Supabase Storage and link it
    console.log("PDF Generated, URL (blob):", url, "Size:", pdfBytes.length);
    // For now, just close the dialog
    setShowPdfDialog(false);
    // Could update the orientation_response record with a generated_pdf_url if stored
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Online Orientation Decision PDFs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Finalized Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Generate and view printable PDF documents for student orientation decisions.
          </p>
          {loading && <p>Loading decisions...</p>}
          {!loading && decisions.length === 0 && <p>No finalized decisions available to generate PDFs.</p>}
          {!loading && decisions.length > 0 && (
             <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Student</TableHeaderCell>
                        <TableHeaderCell>Form</TableHeaderCell>
                        <TableHeaderCell>Decision</TableHeaderCell>
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Decided By</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {decisions.map(decision => (
                        <TableRow key={decision.id}>
                            <TableCell>{decision.student_name}</TableCell>
                            <TableCell>{decision.form_title}</TableCell>
                            <TableCell className="font-medium">{decision.decision}</TableCell>
                            <TableCell>{new Date(decision.decision_date).toLocaleDateString()}</TableCell>
                            <TableCell>{decision.decision_by_name}</TableCell>
                            <TableCell>
                                <Button size="sm" onClick={() => handleGeneratePdfClick(decision)}>Generate PDF</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          )}
        </CardContent>
      </Card>

      {selectedDecisionForPdf && (
          <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
            <DialogContent className="sm:max-w-2xl"> {/* Wider dialog for PDF preview area */}
              <DialogHeader>
                <DialogTitle>Generate PDF: {selectedDecisionForPdf.student_name} - {selectedDecisionForPdf.form_title}</DialogTitle>
              </DialogHeader>
              <div className="py-4 max-h-[70vh] overflow-y-auto">
                <p className="text-sm text-gray-500 mb-2">
                  This will generate a PDF document for the decision. Click "Generate & Download PDF" below.
                </p>
                {/* The PDFGenerator component itself contains the button */}
                <PDFGenerator
                  title={`Orientation Decision: ${selectedDecisionForPdf.student_name}`}
                  filename={pdfFilename}
                  fields={pdfFields}
                  onGenerateSuccess={handlePdfGenerated} // Callback after generation
                  // buttonText="Generate & Download PDF" // Already default
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPdfDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      )}
    </div>
  );
}