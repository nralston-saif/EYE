'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { EventResearch } from '../events/[id]/research'

interface SourcingEvent {
  id: string
  name: string
  location_city: string | null
  location_state: string | null
  start_date: string | null
  end_date: string | null
}

export function SourcingClient({ events }: { events: SourcingEvent[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const selectedEvent = events.find((e) => e.id === selectedEventId)

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p>Create an event first to start sourcing.</p>
          <Link href="/events/new" className="text-primary hover:underline mt-2 inline-block">
            Create your first event
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-md space-y-2">
            <Label>Event context</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event to source for..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Research is tied to an event so results can be saved and imported as vendors.
            </p>
          </div>
        </CardContent>
      </Card>

      {selectedEvent ? (
        <EventResearch
          key={selectedEvent.id}
          eventId={selectedEvent.id}
          eventContext={{
            name: selectedEvent.name,
            location_city: selectedEvent.location_city,
            location_state: selectedEvent.location_state,
            start_date: selectedEvent.start_date,
            end_date: selectedEvent.end_date,
          }}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <p>Select an event above to start AI sourcing.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
