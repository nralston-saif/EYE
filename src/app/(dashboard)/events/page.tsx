import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { differenceInDays } from 'date-fns'
import { EventFilters } from './event-filters'
import { EventsList, type EventListItem } from './events-list'
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

  // Fetch tasks for all events to compute completion % and top pending tasks
  const eventIds = (events || []).map((e: any) => e.id)
  const { data: allTasks } = eventIds.length > 0
    ? await supabase
        .from('tasks')
        .select('id, event_id, title, priority, due_date, status')
        .in('event_id', eventIds)
    : { data: [] }

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
    return tasks.slice(0, 3).map((t: any) => ({ id: t.id, title: t.title, priority: t.priority }))
  }

  const listItems: EventListItem[] = (events || []).map((event: any) => ({
    id: event.id,
    name: event.name,
    status: event.status,
    event_type: event.event_type,
    event_start_date: event.event_start_date,
    event_end_date: event.event_end_date,
    location_city: event.location_city,
    location_name: event.location_name,
    location_state: event.location_state,
    client_name: event.clients?.name ?? null,
    completionPercent: getCompletionPercent(event.id),
    pendingTasks: getTopPendingTasks(event.id),
    daysUntil: event.event_start_date
      ? differenceInDays(new Date(event.event_start_date), new Date())
      : null,
  }))

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
      {listItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No events found</p>
            <Link href="/events/new" className="text-primary hover:underline mt-2 inline-block">
              Create your first event
            </Link>
          </CardContent>
        </Card>
      ) : (
        <EventsList events={listItems} />
      )}
    </div>
  )
}
