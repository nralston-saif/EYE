import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin } from 'lucide-react'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('*, clients(name)')
    .order('start_date', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.type && params.type !== 'all') {
    query = query.eq('event_type', params.type)
  }

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  const { data: events } = await query

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
      <Header
        title="Events"
        description="Manage all your events"
        action={{ label: 'New Event', href: '/events/new' }}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <Input
              name="search"
              placeholder="Search events..."
              defaultValue={params.search}
              className="max-w-xs"
            />
            <Select name="status" defaultValue={params.status || 'all'}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select name="type" defaultValue={params.type || 'all'}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sko">SKO</SelectItem>
                <SelectItem value="summit">Summit</SelectItem>
                <SelectItem value="incentive">Incentive</SelectItem>
                <SelectItem value="vip_dinner">VIP Dinner</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="retreat">Retreat</SelectItem>
                <SelectItem value="product_launch">Product Launch</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </form>
        </CardContent>
      </Card>

      {/* Events List */}
      {!events || events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No events found</p>
            <Link href="/events/new" className="text-primary hover:underline mt-2 inline-block">
              Create your first event
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event: any) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{event.name}</h3>
                        <Badge variant="outline" className={getStatusColor(event.status)}>
                          {event.status?.replace(/_/g, ' ')}
                        </Badge>
                        {event.event_type && (
                          <Badge variant="secondary">
                            {formatEventType(event.event_type)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {event.clients?.name && <span>{event.clients.name}</span>}
                        {(event.location_city || event.location_name) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location_name || event.location_city}
                            {event.location_city && event.location_state && `, ${event.location_state}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {event.start_date ? format(new Date(event.start_date), 'MMM d, yyyy') : 'TBD'}
                      </p>
                      {event.end_date && event.start_date !== event.end_date && (
                        <p className="text-sm text-muted-foreground">
                          to {format(new Date(event.end_date), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
