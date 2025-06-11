'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PDFGenerator, { type PDFField } from '@/components/PDFGenerator'; // Assuming this component is suitable
import { supabase } from '@/lib/supabase'; // Uncommented
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Using Table
import { Badge } from '@/components/ui/badge'; // For status
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'; // For confirmation/details
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Type for fetched request data
type RequestQueryResult = {
  id: string;
  student_id: string;
  requester_id?: string | null;
  request_type: string;
  request_details?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'generated';
  requested_at: string;
  generated_document_id?: string | null;
  student: { full_name: string } | null; // Joined data
  requester: { full_name: string } | null; // Joined data
};

type CertificationRequest = {
  id: string;
  student_id: string;
  student_name: string;
  requester_id?: string | null;
  requester_name: string;
  request_type: string;
  request_details?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'generated';
  requested_at: string;
  generated_document_id?: string | null;
};

export default function AdminCertificatesPage() {
  const [requests, setRequests] = useState<CertificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CertificationRequest | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [pdfFields, setPdfFields] = useState<PDFField[]>([]);
  const [pdfFilename, setPdfFilename] = useState<string>('certificate.pdf');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('certification_requests')
      .select(`
        *,
        student:student_id(full_name),
        requester:requester_id(full_name)
      `)
      .order('requested_at', { ascending: true }); // Show oldest first

    if (error) {
      console.error("Error fetching certification requests:", error);
      setRequests([]);
    } else if (data) {
      const formattedRequests = (data as RequestQueryResult[]).map(r => ({
        id: r.id,
        student_id: r.student_id,
        student_name: r.student?.full_name ?? 'Unknown Student',
        requester_id: r.requester_id,
        requester_name: r.requester?.full_name ?? 'Unknown Requester',
        request_type: r.request_type,
        request_details: r.request_details,
        status: r.status,
        requested_at: r.requested_at,
        generated_document_id: r.generated_document_id,
      }));
      setRequests(formattedRequests);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Function to prepare fields for the PDF generator based on request type
  const preparePdfFields = (request: CertificationRequest): PDFField[] => {
    // TODO: Add logic for different request_types if needed
    // For now, using the generic school attendance certificate fields
    return [
      { name: 'School Name', value: 'El Yassir Educational Institute', x: 50, y: 750, font: 'Helvetica-Bold', size: 24 },
      { name: 'Document Title', value: 'Certificate of School Attendance', x: 50, y: 700, font: 'Helvetica-Bold', size: 18 },
      { name: 'Date Issued', value: `Date: ${new Date().toLocaleDateString()}`, x: 400, y: 650, size: 12 },
      { name: 'Student Name Label', value: 'This is to certify that', x: 50, y: 550, size: 12 },
      { name: 'Student Name Value', value: request.student_name, x: 50, y: 520, font: 'Helvetica-Bold', size: 16 }, // Use actual student name
      { name: 'Certification Body', value: 'has been a registered student at El Yassir Educational Institute for the academic year [Academic Year - TODO: Fetch/Input].', x: 50, y: 490, size: 12 },
      { name: 'Signature Line', value: '_________________________', x: 50, y: 150, size: 12 },
      { name: 'Signatory Name', value: '[Principal Name - TODO: Config]', x: 50, y: 130, size: 12 },
      { name: 'Signatory Title', value: 'Principal', x: 50, y: 110, size: 12 },
      { name: 'School Stamp Placeholder', value: '(School Stamp)', x: 400, y: 130, size: 10 }
    ];
  };

  const handleGenerateClick = (request: CertificationRequest) => {
    setSelectedRequest(request);
    setPdfFields(preparePdfFields(request));
    setPdfFilename(`School_Certificate_${request.student_name.replace(/\s+/g, '_')}_${request.id.substring(0, 8)}.pdf`);
    setShowGenerateDialog(true);
  };

  // Function called after PDFGenerator successfully generates and saves the PDF bytes
  const handlePdfGenerated = async (url: string, pdfBytes: Uint8Array) => {
    if (!selectedRequest) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Need admin user

    // 1. (Optional but recommended) Upload the generated PDF bytes to Supabase Storage
    //    This provides a persistent URL instead of a temporary blob URL.
    //    const filePath = `certificates/${selectedRequest.student_id}/${pdfFilename}`;
    //    const { data: uploadData, error: uploadError } = await supabase.storage
    //      .from('documents') // Or a dedicated 'certificates' bucket
    //      .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    //    if (uploadError) { /* Handle error */ return; }
    //    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
    //    const finalUrl = publicUrl;

    // For simplicity now, we'll skip storage upload and just update the status.
    // In a real app, you'd likely want to store the PDF.

    // 2. Update the certification_requests table
    const { error: updateError } = await supabase
      .from('certification_requests')
      .update({
        status: 'generated',
        // generated_document_id: /* ID if stored in documents table */,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', selectedRequest.id);

    if (updateError) {
      console.error("Error updating request status:", updateError);
      alert(`Failed to update request status: ${updateError.message}`);
    } else {
      console.log(`Request ${selectedRequest.id} marked as generated.`);
      setShowGenerateDialog(false);
      fetchRequests(); // Refresh the list
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | null | undefined => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'approved': return 'default'; // Consider a different color?
        case 'generated': return 'default'; // Greenish
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">School Certification Requests</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pending & Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading requests...</p>}
          {!loading && requests.length === 0 && <p>No certification requests found.</p>}
          {!loading && requests.length > 0 && (
             <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Requested At</TableHeaderCell>
                        <TableHeaderCell>Student</TableHeaderCell>
                        <TableHeaderCell>Requester</TableHeaderCell>
                        <TableHeaderCell>Type</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {requests.map(req => (
                        <TableRow key={req.id}>
                            <TableCell>{new Date(req.requested_at).toLocaleString()}</TableCell>
                            <TableCell>{req.student_name}</TableCell>
                            <TableCell>{req.requester_name}</TableCell>
                            <TableCell>{req.request_type.replace('_', ' ')}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(req.status)} className="capitalize">
                                    {req.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {req.status === 'pending' || req.status === 'approved' ? (
                                    <Button size="sm" onClick={() => handleGenerateClick(req)}>
                                        Generate PDF
                                    </Button>
                                ) : req.status === 'generated' ? (
                                    <span className="text-xs text-green-600">Generated</span>
                                    // Optionally add link to view generated doc if stored
                                ) : (
                                     <span className="text-xs text-red-600">Rejected</span>
                                )}
                                {/* TODO: Add Approve/Reject buttons if needed before generation */}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          )}
        </CardContent>
      </Card>

       {/* Dialog for PDF Generation */}
       <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Certificate for {selectedRequest?.student_name}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-4">Review the details below and click generate to create the PDF document.</p>
                {/* Optionally display key fields from pdfFields here for review */}
                <PDFGenerator
                  title="School Certificate Preview"
                  filename={pdfFilename}
                  fields={pdfFields}
                  buttonText="Generate & Download PDF"
                  // Pass the callback to handle post-generation logic
                  onGenerateSuccess={handlePdfGenerated}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

    </div>
  );
}