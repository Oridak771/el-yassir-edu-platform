'use client';

import React from 'react';
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
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';

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

// Example static events
const staticEvents = [
  { id: '1', title: 'Sample Event', start: '2025-06-10T09:00:00', end: '2025-06-10T10:00:00' },
];

export default function CalendarView({
  userRole,
  userId,
  eventTypes = [],
  onEventClick,
  sampleEvents,
  initialView = 'dayGridMonth'
}: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const events = sampleEvents || staticEvents;

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
