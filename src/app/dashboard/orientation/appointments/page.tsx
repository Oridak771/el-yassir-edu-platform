'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import CalendarView from '@/components/CalendarView'; // Uncommented
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; // Uncommented
import { Input } from '@/components/ui/input'; // Uncommented
import { Label } from '@/components/ui/label'; // Uncommented
import { Textarea } from '@/components/ui/textarea'; // Uncommented
import { User } from '@supabase/supabase-js';

// Type for events fetched from 'events' table, specific to appointments
type AppointmentEvent = {
  id: string;
  title: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  event_type: string; // Should be 'parent_appointment'
  description?: string | null; // For Q&A topics
  location?: string | null; // Could be virtual meeting link
  creator_id?: string | null;
  metadata?: { // Store parent_id, student_name, status here
    parent_id?: string;
    parent_name?: string; // Denormalized for display
    student_name?: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
    q_and_a_topics?: string;
  }
};

// Type matching the 'Event' type expected by CalendarView
type CalendarViewEvent = {
    id: string;
    title: string;
    start: string;
    end: string;
    event_type: string;
    description?: string | undefined;
    location?: string | undefined;
    allDay?: boolean;
    extendedProps?: Record<string, any>;
};

export default function OrientationAppointmentsPage() {
  const [appointments, setAppointments] = useState<CalendarViewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Form state for new appointment
  const [newApptParentEmail, setNewApptParentEmail] = useState('');
  const [newApptStudentName, setNewApptStudentName] = useState('');
  const [newApptStartTime, setNewApptStartTime] = useState(''); // datetime-local
  const [newApptDurationMinutes, setNewApptDurationMinutes] = useState<number>(30);
  const [newApptTopics, setNewApptTopics] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchAppointments = useCallback(async (supervisorId: string | undefined) => {
    if (!supervisorId) {
        setLoading(false);
        return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_type', 'parent_appointment')
      .eq('creator_id', supervisorId) // Assuming supervisor is the creator
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } else if (data) {
      const formattedAppointments = (data as AppointmentEvent[]).map(apt => ({
        id: apt.id,
        title: apt.metadata?.parent_name ? `Appt: ${apt.metadata.parent_name} (${apt.metadata.student_name || 'N/A'})` : apt.title,
        start: apt.start_time,
        end: apt.end_time,
        event_type: apt.event_type,
        description: apt.metadata?.q_and_a_topics ?? apt.description ?? undefined,
        location: apt.location ?? undefined,
        extendedProps: {
            status: apt.metadata?.status || 'scheduled',
            parent_id: apt.metadata?.parent_id,
            student_name: apt.metadata?.student_name,
            q_and_a_topics: apt.metadata?.q_and_a_topics,
        }
      }));
      setAppointments(formattedAppointments);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        fetchAppointments(user.id);
      } else {
        setLoading(false); // No user, stop loading
      }
    };
    init();
  }, [fetchAppointments]);

  const resetForm = () => {
      setNewApptParentEmail('');
      setNewApptStudentName('');
      setNewApptStartTime('');
      setNewApptDurationMinutes(30);
      setNewApptTopics('');
      setShowScheduleDialog(false);
      setIsSubmitting(false);
  };

  const handleScheduleAppointment = async () => {
    if (!currentUser || !newApptParentEmail || !newApptStartTime || newApptDurationMinutes <= 0) {
        alert('Parent Email, Start Time, and Duration are required.');
        return;
    }
    setIsSubmitting(true);

    // 1. Find parent_id from email
    const { data: parentUser, error: parentError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('email', newApptParentEmail)
        .eq('role', 'parent') // Ensure it's a parent account
        .single();

    if (parentError || !parentUser) {
        alert(`Could not find a parent account with email: ${newApptParentEmail}. Please ensure the parent is registered.`);
        console.error("Error finding parent:", parentError);
        setIsSubmitting(false);
        return;
    }

    const startTime = new Date(newApptStartTime);
    const endTime = new Date(startTime.getTime() + newApptDurationMinutes * 60000);

    const eventToInsert = {
        title: `Appointment: ${parentUser.full_name} (${newApptStudentName || 'Child'})`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        event_type: 'parent_appointment',
        creator_id: currentUser.id,
        description: `Q&A Topics: ${newApptTopics || 'Not specified'}`,
        // Store additional info in metadata
        metadata: {
            parent_id: parentUser.id,
            parent_name: parentUser.full_name,
            student_name: newApptStudentName || null,
            q_and_a_topics: newApptTopics || null,
            status: 'scheduled',
            duration_minutes: newApptDurationMinutes,
        },
        visible_to: [currentUser.id, parentUser.id] // Make visible to supervisor and parent
    };

    const { error: insertError } = await supabase.from('events').insert(eventToInsert);

    if (insertError) {
        console.error("Error scheduling appointment:", insertError);
        alert(`Error scheduling appointment: ${insertError.message}`);
    } else {
        alert('Appointment scheduled successfully!');
        resetForm();
        fetchAppointments(currentUser.id); // Refresh calendar
    }
    setIsSubmitting(false);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Parent Q&A Appointment Scheduler</h1>
        <Dialog open={showScheduleDialog} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowScheduleDialog(isOpen);}}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowScheduleDialog(true);}}>Schedule New Appointment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Schedule New Parent Appointment</DialogTitle></DialogHeader>
            <div className="py-4 space-y-3">
              <div>
                <Label htmlFor="parentEmail">Parent's Email *</Label>
                <Input id="parentEmail" type="email" value={newApptParentEmail} onChange={e => setNewApptParentEmail(e.target.value)} required placeholder="parent@example.com"/>
              </div>
              <div>
                <Label htmlFor="studentNameApt">Student's Name (Optional)</Label>
                <Input id="studentNameApt" value={newApptStudentName} onChange={e => setNewApptStudentName(e.target.value)} placeholder="e.g., John Doe Jr."/>
              </div>
              <div>
                <Label htmlFor="aptStartTime">Start Date & Time *</Label>
                <Input id="aptStartTime" type="datetime-local" value={newApptStartTime} onChange={e => setNewApptStartTime(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="aptDuration">Duration (minutes) *</Label>
                <Input id="aptDuration" type="number" value={newApptDurationMinutes} onChange={e => setNewApptDurationMinutes(parseInt(e.target.value, 10))} required min="15" step="15" />
              </div>
              <div>
                <Label htmlFor="aptTopics">Topics for Discussion</Label>
                <Textarea id="aptTopics" value={newApptTopics} onChange={e => setNewApptTopics(e.target.value)} placeholder="e.g., Curriculum questions, child's progress..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleScheduleAppointment} disabled={isSubmitting}>
                {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Manage your scheduled Q&A appointments with parents.
          </p>
          {loading ? (
            <p>Loading appointments...</p>
          ) : (
            <div className="h-[600px]"> {/* Give calendar a defined height */}
                <CalendarView
                    userRole="orientation"
                    userId={String(currentUser?.id ?? '')} // Always a string, never undefined
                    eventTypes={['parent_appointment']} // Filter for these types
                    sampleEvents={appointments} // Pass fetched appointments
                    initialView="timeGridWeek"
                />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Could add a table view of appointments as well */}
      {/* <Card>
        <CardHeader><CardTitle>Appointment List</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : appointments.length === 0 ? <p>No appointments scheduled.</p> : (
            <ul>
                {appointments.map(apt => (
                <li key={apt.id} className="p-2 border rounded">
                    <strong>{apt.title}</strong> - {new Date(apt.start).toLocaleString()}
                    <p className="text-xs">Status: {apt.extendedProps?.status}</p>
                    <p className="text-xs">Topics: {apt.description}</p>
                </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}