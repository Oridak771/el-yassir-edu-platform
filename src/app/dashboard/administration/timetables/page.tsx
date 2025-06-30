'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CalendarView from '@/components/CalendarView'; // Assuming CalendarView can be adapted
import { supabase } from '@/lib/supabase'; // Uncommented

// Type for events fetched from 'events' table
type DbEvent = {
  id: string;
  title: string;
  description?: string | null;
  start_time: string; // ISO string
  end_time: string; // ISO string
  location?: string | null;
  event_type: string;
  // Add other fields if needed
};

// Type for class schedule data from 'classes' table
type ClassScheduleEntry = {
    subject: string;
    time: string; // e.g., "9:00-10:00" - needs parsing
    day: string; // e.g., "Monday", "Tuesday" - needs mapping to dates
    // Add teacher, room etc. if available in JSON
};

type ClassInfoWithSchedule = {
    id: string;
    name: string;
    schedule?: Record<string, ClassScheduleEntry[]>; // e.g., { "Monday": [...], "Tuesday": [...] }
};

// Type matching the 'Event' type expected by CalendarView
type CalendarViewEvent = {
    id: string;
    title: string;
    start: string; // ISO string or Date object
    end: string; // ISO string or Date object
    event_type: string; // Required by CalendarView's Event type
    description?: string | null;
    location?: string | null;
    allDay?: boolean;
    // Add other FullCalendar props like resourceId, color etc. if needed
};

export default function AdminTimetablesPage() {
  const [calendarEvents, setCalendarEvents] = useState<CalendarViewEvent[]>([]); // Use correct type
  const [loading, setLoading] = useState(true);

  const fetchTimetables = useCallback(async () => {
    setLoading(true);
    let combinedEvents: CalendarViewEvent[] = []; // Use correct type

    try {
      // 1. Fetch general events (non-class schedule)
      const { data: dbEventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        // Admins likely see all types, or filter specific ones if needed
        // .in('event_type', ['exam', 'meeting', 'training', 'vacation', 'reminder'])
        ;

      if (eventsError) {
        console.error("Error fetching general events:", eventsError);
      } else if (dbEventsData) {
        const formattedDbEvents = dbEventsData.map((event: DbEvent): CalendarViewEvent => ({ // Ensure return type matches
          id: `event-${event.id}`,
          title: event.title,
          start: event.start_time,
          end: event.end_time,
          allDay: !event.start_time.includes('T'), // Basic check if it's an all-day event
          event_type: event.event_type, // Add the required event_type
          description: event.description ?? undefined, // Ensure undefined instead of null
          location: event.location ?? undefined, // Ensure undefined instead of null
        }));
        combinedEvents = combinedEvents.concat(formattedDbEvents);
      }

      // 2. Fetch class schedules (complex part skipped for now)
      console.warn("Class schedule fetching from JSONB is complex and skipped in this example.");
      /*
      // ... Fetch classesData ...
      classesData.forEach((cls: ClassInfoWithSchedule) => {
          if (cls.schedule) {
              // Process cls.schedule into CalendarViewEvent[]
              // Ensure each generated event has an 'event_type' like 'class_schedule'
          }
      });
      // combinedEvents = combinedEvents.concat(formattedClassScheduleEvents);
      */

      setCalendarEvents(combinedEvents);

    } catch (err) {
        console.error("Error in fetchTimetables:", err);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);


  return (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Timetables & Schedules</h1>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Master Schedule View</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">
            View combined schedules including classes (manual entry needed for recurring), exams, meetings, and other events.
          </p>
          {loading ? (
            <p>Loading schedule...</p>
          ) : (
            <div className="h-[500px]">
              <CalendarView
                userRole="admin"
                sampleEvents={calendarEvents}
                initialView="timeGridWeek"
              />
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Manage Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Tools to manage your schedules:</p>
          <ul className="list-disc pl-5 space-y-2 mt-4 text-sm">
            <li>Create/Edit Class Timetables (Potentially via direct JSON editing or a dedicated UI)</li>
            <li>Schedule General Events (Exams, Meetings, Training etc. - likely via 'events' table)</li>
            {/* Add more management actions */}
          </ul>
          <Button className="mt-4">Add New Schedule/Event (Placeholder)</Button>
        </CardContent>
      </Card>

    </div>
  </div>
  );
}