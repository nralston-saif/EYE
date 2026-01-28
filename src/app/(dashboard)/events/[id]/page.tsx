import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { MapPin, Calendar, Building2, Edit } from 'lucide-react'
import Link from 'next/link'
import { EventTasks } from './tasks'
import { EventBudget } from './budget'
import { EventFiles } from './files'
import { EventMeetings } from './meetings'
import { EventResearch } from './research'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: eventData } = await supabase
    .from('events')
    .select('*, clients(id, name)')
    .eq('id', id)
    .single()

  const event = eventData as any

  if (!event) {
    notFound()
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'on_hold': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatEventType = (type: string | null) => {
    if (!type) return ''
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            <Badge variant="outline" className={getStatusColor(event.status)}>
              {event.status?.replace(/_/g, ' ')}
            </Badge>
            {event.event_type && (
              <Badge variant="secondary">{formatEventType(event.event_type)}</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            {event.clients && (
              <Link href={`/clients/${event.clients.id}`} className="flex items-center gap-1 hover:text-primary">
                <Building2 className="h-4 w-4" />
                {event.clients.name}
              </Link>
            )}
            {event.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.start_date), 'MMM d, yyyy')}
                {event.end_date && event.start_date !== event.end_date && (
                  <> - {format(new Date(event.end_date), 'MMM d, yyyy')}</>
                )}
              </span>
            )}
            {(event.location_city || event.location_name) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location_name}
                {event.location_city && `, ${event.location_city}`}
                {event.location_state && `, ${event.location_state}`}
              </span>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/events/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="mt-1">{event.description}</p>
                  </div>
                )}
                {event.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap">{event.notes}</p>
                  </div>
                )}
                {!event.description && !event.notes && (
                  <p className="text-muted-foreground">No additional details</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                {event.location_name || event.location_address || event.location_city ? (
                  <div className="space-y-1">
                    {event.location_name && <p className="font-medium">{event.location_name}</p>}
                    {event.location_address && <p>{event.location_address}</p>}
                    {event.location_city && (
                      <p>
                        {event.location_city}
                        {event.location_state && `, ${event.location_state}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No location set</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <EventTasks eventId={id} />
        </TabsContent>

        <TabsContent value="budget">
          <EventBudget eventId={id} />
        </TabsContent>

        <TabsContent value="meetings">
          <EventMeetings eventId={id} />
        </TabsContent>

        <TabsContent value="files">
          <EventFiles eventId={id} />
        </TabsContent>

        <TabsContent value="research">
          <EventResearch
            eventId={id}
            eventContext={{
              name: event.name,
              location_city: event.location_city,
              location_state: event.location_state,
              start_date: event.start_date,
              end_date: event.end_date,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
