'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import { Textarea } from '@/components/ui/textarea'; // Uncommented
import { Input } from '@/components/ui/input'; // Uncommented
import { Label } from '@/components/ui/label'; // Uncommented
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; // Uncommented
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; // Uncommented
import { Badge } from '@/components/ui/badge'; // For status

// Type for fetched convocation (notification) data
type ConvocationNotification = {
  id: string; // notification id
  title: string;
  message: string; // This will be the body of the convocation
  created_at: string;
  // Metadata will store target_group, target_grade_level, original_sender_id etc.
  metadata?: {
    target_group?: 'all_students_grade_x' | 'parents_grade_x' | 'specific_users'; // Add more as needed
    target_grade_level?: string;
    original_sender_id?: string; // Could be useful for filtering if needed
    // status: 'draft' | 'sent'; // Removed status from here, as it's not in the notifications table
  }
};

// Type for form data
type ConvocationFormData = {
    title: string;
    message: string;
    target_group: 'all_students_grade_x' | 'parents_grade_x'; // Simplified for now
    target_grade_level: string;
};

export default function OrientationConvocationsPage() {
  const [convocations, setConvocations] = useState<ConvocationNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConvocationDialog, setShowConvocationDialog] = useState(false);
  const [formData, setFormData] = useState<ConvocationFormData>({ title: '', message: '', target_group: 'all_students_grade_x', target_grade_level: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConvocations = useCallback(async (supervisorId: string) => {
    setLoading(true);
    // Fetch notifications of type 'convocation_notice' created by this supervisor
    // We'll assume the 'user_id' on the notification table for convocations
    // might be the supervisor who created it, or we use metadata.
    // For simplicity, let's assume a metadata field 'original_sender_id' or filter by type.
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'convocation_notice') // A specific type for these
      // .eq('metadata->>original_sender_id', supervisorId) // If storing sender in metadata
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching convocations:', error);
      setConvocations([]);
    } else {
      setConvocations(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        // Redirect or handle
        return;
      }
      setCurrentUser(user); // Store the auth user
      fetchConvocations(user.id);
    };
    init();
  }, [fetchConvocations]);

  const resetForm = () => {
    setFormData({ title: '', message: '', target_group: 'all_students_grade_x', target_grade_level: '' });
    setShowConvocationDialog(false);
    setIsSubmitting(false);
  };

  const handleSendConvocation = async () => {
    if (!currentUser || !formData.title || !formData.message || (formData.target_group.includes('_grade_x') && !formData.target_grade_level)) {
      alert('Please fill in all required fields (Title, Message, and Target Grade if applicable).');
      return;
    }
    setIsSubmitting(true);

    let targetUserIds: string[] = [];

    try {
        if (formData.target_group === 'all_students_grade_x') {
            const { data: students, error: studentError } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'parent') // Assuming students are represented by parent accounts for notifications, or change to 'student' role
                .eq('metadata->>grade_level', formData.target_grade_level); // Example: if grade is in metadata
            if (studentError) throw studentError;
            targetUserIds = students?.map(s => s.id) || [];
        } else if (formData.target_group === 'parents_grade_x') {
            // This is more complex: find students of that grade, then find their parents
            const { data: studentsInGrade, error: studentError } = await supabase
                .from('users') // Assuming students have a grade_level in their profile or a linked class
                .select('id, metadata->>parent_id')
                .eq('role', 'parent') // Or 'student' if parents are linked differently
                .eq('metadata->>grade_level', formData.target_grade_level); // Adjust based on schema

            if (studentError) throw studentError;
            
            const parentIds = studentsInGrade
                ?.map(s => (s as any)['metadata->>parent_id']) // Access potentially dynamic key
                .filter(id => id) as string[] || [];
            targetUserIds = [...new Set(parentIds)]; // Unique parent IDs
        }

        if (targetUserIds.length === 0) {
            alert('No recipients found for the selected target group and grade.');
            setIsSubmitting(false);
            return;
        }

        const notificationsToInsert = targetUserIds.map(userId => ({
            user_id: userId,
            title: formData.title,
            message: formData.message,
            type: 'convocation_notice',
            metadata: {
                original_sender_id: currentUser.id,
                target_group: formData.target_group,
                target_grade_level: formData.target_group.includes('_grade_x') ? formData.target_grade_level : undefined
              }
            }));

        const { error: insertError } = await supabase.from('notifications').insert(notificationsToInsert);
        if (insertError) throw insertError;

        alert(`Convocation sent successfully to ${targetUserIds.length} recipient(s).`);
        resetForm();
        fetchConvocations(currentUser.id); // Refresh list

    } catch (error: any) {
        console.error("Error sending convocation:", error);
        alert(`Failed to send convocation: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Convocation Notifications</h1>
        <Dialog open={showConvocationDialog} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowConvocationDialog(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowConvocationDialog(true);}}>Create New Convocation</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create Convocation</DialogTitle></DialogHeader>
            <div className="py-4 space-y-3">
              <div>
                <Label htmlFor="convTitle">Title *</Label>
                <Input id="convTitle" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div>
                <Label htmlFor="convTarget">Target Group *</Label>
                <Select value={formData.target_group} onValueChange={val => setFormData({...formData, target_group: val as ConvocationFormData['target_group']})} required>
                  <SelectTrigger id="convTarget"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_students_grade_x">All Students (Specify Grade)</SelectItem>
                    <SelectItem value="parents_grade_x">Parents (Specify Grade)</SelectItem>
                    {/* Add more specific targeting options as needed */}
                  </SelectContent>
                </Select>
              </div>
              {formData.target_group.includes('_grade_x') &&
                <div>
                    <Label htmlFor="convGrade">Target Grade Level *</Label>
                    <Input id="convGrade" placeholder="e.g., 9" value={formData.target_grade_level} onChange={e => setFormData({...formData, target_grade_level: e.target.value})} required />
                </div>
              }
              <div>
                <Label htmlFor="convMessage">Message *</Label>
                <Textarea id="convMessage" rows={6} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSendConvocation} disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Convocation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sent & Draft Convocations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading convocations...</p>}
          {!loading && convocations.length === 0 && <p>No convocations found.</p>}
          {!loading && convocations.length > 0 && (
            <ul className="space-y-3">
              {convocations.map(conv => (
                <li key={conv.id} className={`p-3 border rounded-md`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{conv.title}</h3>
                      <p className="text-xs text-gray-500">
                        Target: {conv.metadata?.target_group?.replace('_grade_x', '')}{conv.metadata?.target_grade_level ? ` (Grade ${conv.metadata.target_grade_level})` : ''}
                      </p>
                      <p className="text-xs text-gray-500">Created: {new Date(conv.created_at).toLocaleString()}</p>
                      <p className="text-sm mt-1 line-clamp-2">{conv.message}</p>
                    </div>
                    <div className="flex flex-col space-y-1 rtl:space-y-reverse mt-2 sm:mt-0">
                      <Button variant="outline" size="sm" onClick={() => alert(`Viewing details for: ${conv.title}`)}>View Details</Button>
                      {/* Edit/Delete for convocations might mean deleting notification entries, or managing a separate 'convocations' table */}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}