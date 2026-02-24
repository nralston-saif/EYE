import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { MapPin, AlertCircle } from 'lucide-react'
import { EventFilters } from './event-filters'
import { formatEventType, formatStatus } from '@/lib/utils'
import { Suspense } from 'react'

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
    .order('event_start_date', { ascending: false })

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

  // Fetch tasks for all events to compute completion %
  const eventIds = (events || []).map((e: any) => e.id)
  const { data: allTasks } = eventIds.length > 0
    ? await supabase
        .from('tasks')
        .select('id, event_id, title, priority, due_date, status')
        .in('event_id', eventIds)
    : { data: [] }

  // Build task maps per event
  const tasksByEvent: Record<string, any[]> = {}
  for (const task of allTasks || []) {
    if (!task.event_id) continue
    if (!tasksByEvent[task.event_id]) tasksByEvent[task.event_id] = []
    tasksByEvent[task.event_id].push(task)
  }

  const getCompletionPercent = (eventId: string) => {
    const tasks = tasksByEvent[eventId] || []
    if (tasks.length === 0) return null
    const completed = tasks.filter((t: any) => t.status === 'completed').length
    return Math.round((completed / tasks.length) * 100)
  }

  // Get top pending tasks per event (for Phase 3.1)
  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
  const getTopPendingTasks = (eventId: string) => {
    const tasks = (tasksByEvent[eventId] || [])
      .filter((t: any) => t.status === 'pending')
      .sort((a: any, b: any) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 4
        const pb = PRIORITY_ORDER[b.priority] ?? 4
        if (pa !== pb) return pa - pb
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
        if (a.due_date) return -1
        if (b.due_date) return 1
        return 0
      })
    return tasks.slice(0, 3)
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

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
          <Suspense>
            <EventFilters />
          </Suspense>
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
          {events.map((event: any) => {
            const completionPercent = getCompletionPercent(event.id)
            const pendingTasks = getTopPendingTasks(event.id)
            const daysUntil = event.event_start_date
              ? differenceInDays(new Date(event.event_start_date), new Date())
              : null

            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{event.name}</h3>
                          <Badge variant="outline" className={getStatusColor(event.status)}>
                            {formatStatus(event.status)}
                          </Badge>
                          {event.event_type && (
                            <Badge variant="secondary">
                              {formatEventType(event.event_type)}
                            </Badge>
                          )}
                          {daysUntil !== null && (
                            <Badge variant="secondary" className="text-xs">
                              {daysUntil === 0 ? 'Today' : daysUntil > 0 ? `In ${daysUntil} days` : `${Math.abs(daysUntil)} days ago`}
                            </Badge>
                          )}
                          {completionPercent !== null && (
                            <span className="text-xs text-muted-foreground ml-1">
                              {completionPercent}% complete
                            </span>
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
                        {/* Completion progress bar */}
                        {completionPercent !== null && (
                          <div className="mt-2 w-48">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${completionPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {/* Pending tasks */}
                        {pendingTasks.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {pendingTasks.map((task: any) => (
                              <span key={task.id} className="inline-flex items-center gap-1 text-xs">
                                <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-xs px-1 py-0`}>
                                  {task.priority}
                                </Badge>
                                <span className="text-muted-foreground truncate max-w-[200px]">{task.title}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {event.event_start_date ? format(new Date(event.event_start_date), 'MMM d, yyyy') : 'TBD'}
                        </p>
                        {event.event_end_date && event.event_start_date !== event.event_end_date && (
                          <p className="text-sm text-muted-foreground">
                            to {format(new Date(event.event_end_date), 'MMM d')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
