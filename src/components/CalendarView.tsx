'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
<<<<<<< HEAD
import { supabase } from '@/lib/supabase';
=======
>>>>>>> 90d3ac78f9d27dce9c7a5880abde4b7506fb9702
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
<<<<<<< HEAD
=======
import { supabase } from '@/lib/supabase';
>>>>>>> 90d3ac78f9d27dce9c7a5880abde4b7506fb9702

interface Event {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  type?: string;
  event_type?: string;
  location?: string;
}

interface CalendarViewProps {
  userRole: string;
  userId: string;
  events?: Event[];
  eventTypes?: string[];
  onEventClick?: (event: Event) => void;
  sampleEvents?: Event[];
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
}

export default function CalendarView({
  userRole,
  userId,
  eventTypes = [],
  onEventClick,
  sampleEvents,
  initialView = 'dayGridMonth'
}: CalendarViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  useEffect(() => {
    if (sampleEvents && sampleEvents.length > 0) {
      setEvents(sampleEvents.map((event: Event) => ({
        ...event,
        id: event.id || crypto.randomUUID()
      })));
      return;
    }
    if (userId) {
      fetchEvents();
    }
  }, [userId, sampleEvents]);

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('user_id', userId);

      const { data, error } = await query;
<<<<<<< HEAD

      if (error) throw error;

=======
      if (error) throw error;
>>>>>>> 90d3ac78f9d27dce9c7a5880abde4b7506fb9702
      const formattedEvents: Event[] = data.map((event: any) => ({
        id: event.id || crypto.randomUUID(),
        title: event.title || '',
        description: event.description,
        start: event.start_date,
        end: event.end_date,
        type: event.event_type,
        event_type: event.event_type,
        location: event.location
      }));
<<<<<<< HEAD

=======
>>>>>>> 90d3ac78f9d27dce9c7a5880abde4b7506fb9702
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setShowEventDetails(true);
      onEventClick?.(event);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={initialView}
            events={events}
            editable={false}
            selectable={true}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            eventClick={handleEventClick}
            eventClassNames={(arg: EventContentArg) => [
              `event-${(arg.event.extendedProps as Event)?.type || 'default'}`
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              <div className="space-y-2">
                <div>{selectedEvent?.description}</div>
                <div>{selectedEvent?.event_type}</div>
                {selectedEvent?.location && (
                  <div className="text-sm text-gray-500">
                    Location: {selectedEvent.location}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowEventDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
