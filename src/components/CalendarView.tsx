'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabase';
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

type Event = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  event_type: string;
};

type CalendarViewProps = {
  userRole: string;
  userId: string;
  eventTypes?: string[];
  onEventClick?: (event: Event) => void;
  sampleEvents?: Event[];
};

export default function CalendarView({ 
  userRole, 
  userId, 
  eventTypes = [], 
  onEventClick,
  sampleEvents
}: CalendarViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  useEffect(() => {
    if (sampleEvents && sampleEvents.length > 0) {
      setEvents(sampleEvents.map((e, idx) => ({ id: e.id || String(idx), ...e })));
      return;
    }
    fetchEvents();
  }, [userRole, userId, eventTypes, sampleEvents]);

  async function fetchEvents() {
    try {
      // Construct the query based on user role and event types
      let query = supabase
        .from('events')
        .select('*');
      
      // Filter by event type if specified
      if (eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }
      
      // Filter by visibility based on role
      if (userRole !== 'admin' && userRole !== 'orientation') {
        query = query.or(`visible_to.cs.{${userRole},all}`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data for FullCalendar
      const formattedEvents = data.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start_time,
        end: event.end_time,
        location: event.location,
        event_type: event.event_type,
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }

  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const clickedEvent = events.find(e => e.id === eventId) || null;
    
    if (clickedEvent) {
      setSelectedEvent(clickedEvent);
      
      if (onEventClick) {
        onEventClick(clickedEvent);
      } else {
        setShowEventDetails(true);
      }
    }
  };

  return (
    <div className="h-full">
      <Card className="h-full">
        <CardContent className="p-4 h-full">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            eventClick={handleEventClick}
            height="100%"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
            eventClassNames={(arg) => {
              return [`event-type-${arg.event.extendedProps.event_type}`];
            }}
          />
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              <div className="grid grid-cols-[80px_1fr] gap-2 mt-4">
                <div className="font-semibold">Type:</div>
                <div>{selectedEvent?.event_type}</div>
                
                <div className="font-semibold">When:</div>
                <div>
                  {selectedEvent && (
                    <>
                      {new Date(selectedEvent.start).toLocaleString()} to {' '}
                      {new Date(selectedEvent.end).toLocaleString()}
                    </>
                  )}
                </div>
                
                {selectedEvent?.location && (
                  <>
                    <div className="font-semibold">Where:</div>
                    <div>{selectedEvent.location}</div>
                  </>
                )}
                
                {selectedEvent?.description && (
                  <>
                    <div className="font-semibold">Details:</div>
                    <div>{selectedEvent.description}</div>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
