import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Building2, HardHat, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { format, isAfter, isBefore, addDays } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch summary data
  const [eventsRes, clientsRes, contractorsRes, tasksRes, upcomingEventsRes] = await Promise.all([
    supabase.from('events').select('id, status').not('status', 'in', '("completed","cancelled")'),
    supabase.from('clients').select('id', { count: 'exact' }),
    supabase.from('contractors').select('id', { count: 'exact' }),
    supabase.from('tasks').select('id, status').eq('status', 'pending'),
    supabase.from('events')
      .select('id, name, start_date, end_date, status, event_type, clients(name)')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(5),
  ])

  const activeEvents = eventsRes.data?.length || 0
  const totalClients = clientsRes.count || 0
  const totalContractors = contractorsRes.count || 0
  const pendingTasks = tasksRes.data?.length || 0
  const upcomingEvents = upcomingEventsRes.data || []

  const stats = [
    { name: 'Active Events', value: activeEvents, icon: Calendar, href: '/events' },
    { name: 'Clients', value: totalClients, icon: Building2, href: '/clients' },
    { name: 'Contractors', value: totalContractors, icon: HardHat, href: '/contractors' },
    { name: 'Pending Tasks', value: pendingTasks, icon: CheckSquare, href: '/events' },
  ]

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
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
      <Header title="Dashboard" description="Welcome back! Here's an overview of your events." />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events happening soon</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming events</p>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{event.name}</h3>
                      <Badge variant="outline" className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {event.clients?.name && <span>{event.clients.name}</span>}
                      {event.event_type && <span>{formatEventType(event.event_type)}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {event.start_date ? format(new Date(event.start_date), 'MMM d, yyyy') : 'TBD'}
                    </p>
                    {event.end_date && event.start_date !== event.end_date && (
                      <p className="text-sm text-muted-foreground">
                        to {format(new Date(event.end_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
