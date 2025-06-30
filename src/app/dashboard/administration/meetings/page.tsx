'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CalendarView from '@/components/CalendarView'; // For displaying meetings
import { supabase } from '@/lib/supabase'; // Uncommented
import { Input } from '@/components/ui/input'; // Uncommented
import { Textarea } from '@/components/ui/textarea'; // Uncommented
import { Label } from '@/components/ui/label'; // Uncommented
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'; // Uncommented

// Type for events fetched from 'events' table
type DbEvent = {
  id: string;
  title: string;
  description?: string | null;
  start_time: string; // ISO string
  end_time: string; // ISO string
  location?: string | null;
  event_type: string;
  creator_id?: string | null;
  // Add other fields if needed
};

// Type matching the 'Event' type expected by CalendarView
// Ensure description and location are string | undefined
type CalendarViewEvent = {
    id: string;
    title: string;
    start: string; // ISO string or Date object
    end: string; // ISO string or Date object
    event_type: string; // Required by CalendarView's Event type
    description?: string | undefined; // Changed from null allowed
    location?: string | undefined; // Changed from null allowed
    allDay?: boolean;
};

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<CalendarViewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // New meeting form state
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDescription, setNewMeetingDescription] = useState('');
  const [newMeetingStartTime, setNewMeetingStartTime] = useState('');
  const [newMeetingEndTime, setNewMeetingEndTime] = useState('');
  const [newMeetingLocation, setNewMeetingLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get current session
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    
    getCurrentUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    const meetingTypes = ['meeting', 'call_slot', 'council_meeting']; // Define relevant types
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('event_type', meetingTypes); // Fetch only meeting-related events

    if (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
    } else if (data) {
      const formattedMeetings = (data as DbEvent[]).map((event: DbEvent): CalendarViewEvent => ({ // Ensure return type matches
        id: `event-${event.id}`,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        allDay: !event.start_time.includes('T'),
        event_type: event.event_type,
        description: event.description ?? undefined, // Ensure undefined instead of null
        location: event.location ?? undefined, // Ensure undefined instead of null
      }));
      setMeetings(formattedMeetings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const resetForm = () => {
      setNewMeetingTitle('');
      setNewMeetingDescription('');
      setNewMeetingStartTime('');
      setNewMeetingEndTime('');
      setNewMeetingLocation('');
      setShowScheduleDialog(false);
  };

  const handleCreateMeeting = async () => {
    if (!newMeetingTitle || !newMeetingStartTime || !newMeetingEndTime) {
        alert('Please provide a title, start time, and end time.');
        return;
    }
    // Basic date validation
    if (new Date(newMeetingEndTime) <= new Date(newMeetingStartTime)) {
        alert('End time must be after start time.');
        return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser(); // Get current user

    const { error } = await supabase.from('events').insert([{
        title: newMeetingTitle,
        description: newMeetingDescription || undefined, // Ensure undefined if empty
        start_time: new Date(newMeetingStartTime).toISOString(), // Convert to ISO string
        end_time: new Date(newMeetingEndTime).toISOString(), // Convert to ISO string
        location: newMeetingLocation || undefined, // Ensure undefined if empty
        event_type: 'meeting', // Default to 'meeting', could add a type selector
        creator_id: user?.id, // Link to creator
        visible_to: ['admin', 'orientation', 'professor'] // Example visibility, adjust as needed
    }]);

    if (error) {
        console.error("Error creating meeting:", error);
        alert(`Error creating meeting: ${error.message}`);
    } else {
        alert('Meeting scheduled successfully!');
        resetForm();
        fetchMeetings(); // Refresh calendar
    }
    setIsSubmitting(false);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meetings & Calls</h1>
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowScheduleDialog(true)}>Schedule Meeting</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>Schedule New Meeting/Call</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mTitle" className="text-right">Title *</Label>
                <Input id="mTitle" value={newMeetingTitle} onChange={(e) => setNewMeetingTitle(e.target.value)} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mDesc" className="text-right">Description</Label>
                <Textarea id="mDesc" value={newMeetingDescription} onChange={(e) => setNewMeetingDescription(e.target.value)} className="col-span-3" rows={3} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mStart" className="text-right">Start Time *</Label>
                <Input id="mStart" type="datetime-local" value={newMeetingStartTime} onChange={(e) => setNewMeetingStartTime(e.target.value)} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mEnd" className="text-right">End Time *</Label>
                <Input id="mEnd" type="datetime-local" value={newMeetingEndTime} onChange={(e) => setNewMeetingEndTime(e.target.value)} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mLocation" className="text-right">Location/Link</Label>
                <Input id="mLocation" value={newMeetingLocation} onChange={(e) => setNewMeetingLocation(e.target.value)} className="col-span-3" placeholder="e.g., Conference Room B, Zoom Link" />
              </div>
              {/* Add attendees selection if using the 'meetings' table instead of 'events' */}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleCreateMeeting} disabled={isSubmitting}>
                {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Meetings & Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading schedule...</p>
            ) : (
              <div className="h-[500px]">
                <CalendarView
                  userRole="admin"
                  userId={currentUser?.id || ''}
                  eventTypes={['meeting', 'call']}
                  sampleEvents={meetings}
                  initialView="timeGridWeek"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Meeting History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">View past meetings with details and minutes (if applicable).</p>
              {loading ? (
                <p>Loading meeting history...</p>
              ) : meetings.filter(m => new Date(m.end) < new Date()).length === 0 ? (
                <p>No past meetings found.</p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <ul className="space-y-3">
                    {meetings
                      .filter(m => new Date(m.end) < new Date())
                      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
                      .map(meeting => (
                        <li key={meeting.id} className="p-4 border rounded-lg">
                          <h3 className="font-medium">{meeting.title}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(meeting.start).toLocaleString()} - {new Date(meeting.end).toLocaleString()}
                          </p>
                          {meeting.location && (
                            <p className="text-sm text-gray-500">Location: {meeting.location}</p>
                          )}
                          {meeting.description && (
                            <p className="text-sm mt-2">{meeting.description}</p>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}