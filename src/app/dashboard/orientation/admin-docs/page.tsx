'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Using Table
import { Badge } from '@/components/ui/badge'; // For status
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { User } from '@supabase/supabase-js';


type AdminDocumentAlertMetadata = {
  document_name: string;
  description?: string;
  pickup_location: string;
  available_from: string; // Date string
  deadline_to_pickup?: string; // Date string
  status: 'pending_pickup' | 'picked_up' | 'archived';
  intended_for_role?: 'student' | 'parent' | 'professor' | 'all_users';
};

type AdminDocumentAlert = {
  id: string; // Notification ID
  created_at: string;
  metadata: AdminDocumentAlertMetadata;
  // title and message from notification table can be used or overridden by metadata
  title?: string;
  message?: string;
};

// Type for form data
type AlertFormData = {
    document_name: string;
    description: string;
    pickup_location: string;
    available_from: string;
    deadline_to_pickup: string;
    intended_for_role: 'student' | 'parent' | 'professor' | 'all_users';
};

export default function OrientationAdminDocsPage() {
  const [docAlerts, setDocAlerts] = useState<AdminDocumentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>({
      document_name: '',
      description: '',
      pickup_location: 'Orientation Desk',
      available_from: '',
      deadline_to_pickup: '',
      intended_for_role: 'all_users',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocAlerts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'admin_document_pickup')
      // .or(`metadata->>intended_for_role.eq.orientation, metadata->>creator_id.eq.${currentUser?.id}`) // Example filter if needed
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching document alerts:', error);
      setDocAlerts([]);
    } else if (data) {
      // Ensure metadata is parsed correctly
      const formattedAlerts = data.map(n => ({
          id: n.id,
          created_at: n.created_at,
          title: n.title, // Use notification title
          message: n.message, // Use notification message
          metadata: n.metadata as AdminDocumentAlertMetadata, // Cast metadata
      })).filter(n => n.metadata && typeof n.metadata === 'object'); // Filter out malformed ones
      setDocAlerts(formattedAlerts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        fetchDocAlerts();
      } else {
        setLoading(false); // No user, stop loading
      }
    };
    init();
  }, [fetchDocAlerts]);

  const resetForm = () => {
      setFormData({
          document_name: '', description: '', pickup_location: 'Orientation Desk',
          available_from: '', deadline_to_pickup: '', intended_for_role: 'all_users',
      });
      setShowCreateDialog(false);
      setIsSubmitting(false);
  };

  const handleCreateAlert = async () => {
    if (!currentUser || !formData.document_name || !formData.pickup_location || !formData.available_from) {
        alert("Document Name, Pickup Location, and Available From date are required.");
        return;
    }
    setIsSubmitting(true);

    const alertMetadata: AdminDocumentAlertMetadata = {
        ...formData,
        status: 'pending_pickup',
    };

    const { error } = await supabase.from('notifications').insert([{
        user_id: null, // This is a general alert, not for a specific user initially
        title: `Document Pickup: ${formData.document_name}`,
        message: `The document "${formData.document_name}" is available for pickup at ${formData.pickup_location} from ${new Date(formData.available_from).toLocaleDateString()}. ${formData.deadline_to_pickup ? `Deadline: ${new Date(formData.deadline_to_pickup).toLocaleDateString()}.` : ''} ${formData.description || ''}`,
        type: 'admin_document_pickup',
        metadata: alertMetadata,
        // RLS should allow admin/orientation to insert this type
    }]);

    if (error) {
        console.error("Error creating document alert:", error);
        alert(`Error creating alert: ${error.message}`);
    } else {
        alert('Document pickup alert created successfully.');
        resetForm();
        fetchDocAlerts();
    }
    setIsSubmitting(false);
  };

  const handleMarkAsPickedUp = async (alertId: string, currentMetadata: AdminDocumentAlertMetadata) => {
    setIsSubmitting(true); // Can use a more specific loading state if needed
    const updatedMetadata = { ...currentMetadata, status: 'picked_up' as const }; // Ensure type correctness
    const { error } = await supabase
      .from('notifications')
      .update({ metadata: updatedMetadata })
      .eq('id', alertId);

    if (error) {
      console.error('Error updating alert status:', error);
      alert(`Failed to update status: ${error.message}`);
    } else {
      alert('Alert marked as picked up.');
      fetchDocAlerts(); // Refresh list
    }
    setIsSubmitting(false);
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | null | undefined => {
    switch (status) {
        case 'pending_pickup': return 'secondary';
        case 'picked_up': return 'default';
        case 'archived': return 'outline';
        default: return 'outline';
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Document Pickup Alerts</h1>
        <Dialog open={showCreateDialog} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowCreateDialog(isOpen);}}>
            <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setShowCreateDialog(true);}}>Create New Alert</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Create Document Pickup Alert</DialogTitle></DialogHeader>
                <div className="py-4 grid gap-4">
                    <div><Label htmlFor="docName">Document Name *</Label><Input id="docName" value={formData.document_name} onChange={e => setFormData({...formData, document_name: e.target.value})} required /></div>
                    <div><Label htmlFor="docDesc">Description</Label><Textarea id="docDesc" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} /></div>
                    <div><Label htmlFor="docPickup">Pickup Location *</Label><Input id="docPickup" value={formData.pickup_location} onChange={e => setFormData({...formData, pickup_location: e.target.value})} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label htmlFor="docAvailable">Available From *</Label><Input id="docAvailable" type="date" value={formData.available_from} onChange={e => setFormData({...formData, available_from: e.target.value})} required /></div>
                        <div><Label htmlFor="docDeadline">Deadline (Optional)</Label><Input id="docDeadline" type="date" value={formData.deadline_to_pickup} onChange={e => setFormData({...formData, deadline_to_pickup: e.target.value})} /></div>
                    </div>
                    <div>
                        <Label htmlFor="docTargetRole">Intended For Role</Label>
                        <Select value={formData.intended_for_role} onValueChange={val => setFormData({...formData, intended_for_role: val as AlertFormData['intended_for_role']})}>
                            <SelectTrigger id="docTargetRole"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_users">All Users</SelectItem>
                                <SelectItem value="student">Students</SelectItem>
                                <SelectItem value="parent">Parents</SelectItem>
                                <SelectItem value="professor">Professors</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleCreateAlert} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Alert'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Document Pickup Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading alerts...</p>}
          {!loading && docAlerts.length === 0 && <p>No active document pickup alerts.</p>}
          {!loading && docAlerts.length > 0 && (
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Document Name</TableHeaderCell>
                        <TableHeaderCell>For Role</TableHeaderCell>
                        <TableHeaderCell>Pickup Location</TableHeaderCell>
                        <TableHeaderCell>Available From</TableHeaderCell>
                        <TableHeaderCell>Deadline</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {docAlerts.map(alert => (
                        <TableRow key={alert.id}>
                            <TableCell className="font-medium">{alert.metadata.document_name}</TableCell>
                            <TableCell className="capitalize">{alert.metadata.intended_for_role?.replace('_', ' ') || 'N/A'}</TableCell>
                            <TableCell>{alert.metadata.pickup_location}</TableCell>
                            <TableCell>{new Date(alert.metadata.available_from).toLocaleDateString()}</TableCell>
                            <TableCell>{alert.metadata.deadline_to_pickup ? new Date(alert.metadata.deadline_to_pickup).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(alert.metadata.status)} className="capitalize">
                                    {alert.metadata.status.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {alert.metadata.status === 'pending_pickup' &&
                                  <Button size="sm" onClick={() => handleMarkAsPickedUp(alert.id, alert.metadata)} disabled={isSubmitting}>Mark Picked Up</Button>}
                                {/* Add other actions like 'Archive' if needed */}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}